import {
    App,
    RegisterApp,
} from "@hotbunny/hackhub-content-sdk";
import appHTML from "../../../entity-resolution.html";

import {
    executeDssCommand,
    getLastCommandResult,
} from "../dss-command-runtime.js";
import type {
    DssCommandResultSnapshot,
} from "../dss-command-runtime.js";
import {
    opsRuntime,
} from "../../../application/ops/runtime.js";
import type {
    OpsCommandDefinition,
} from "../../../application/ops/command-registry.js";
import type {
    OpsSessionSnapshot,
} from "../../../application/ops/session-store.js";
import type {
    PacketSessionSnapshot,
} from "../../../application/ops/packet-session-store.js";
import type {
    OpsToolDefinition,
} from "../../../application/ops/tool-registry.js";
import type {
    ReconProfile,
} from "../../../domain/recon/index.js";

const DSS_DIRECT_INTERACTION_PATCH = `
<script>
(() => {
  const views={terminal:'view-terminal',recon:'view-recon',wireshark:'view-wireshark'};
  const $=id=>document.getElementById(id);
  const text=(id,value)=>{const el=$(id);if(el)el.textContent=String(value??'')};
  const progress=value=>{const v=Math.max(0,Math.min(100,Number(value)||0));text('percent',v+'%');const bar=$('bar');if(bar)bar.style.width=v+'%'};
  const appendLine=(value,kind='line-info')=>{const output=$('terminal-output');if(!output)return;const el=document.createElement('div');el.className='line '+kind;el.textContent=String(value??'');output.append(el);while(output.children.length>500)output.removeChild(output.firstChild);output.scrollTo(0,output.scrollHeight)};
  const globalExport=(name)=>{const value=globalThis[name];return typeof value==='function'?value:null};
  const getSdk=()=>globalThis.HackhubSDK;
  const emitCommandRequest=(commandLine)=>{const sdk=getSdk();if(!sdk?.Events?.emit)return false;sdk.Events.emit('DSS.Command.Request',{commandLine});return true};
  const getSession=()=>{const fn=globalExport('getSession');if(!fn)return null;try{return fn()}catch{return null}};
  const getReconProfiles=()=>{const fn=globalExport('getReconProfiles');if(!fn)return[];try{const value=fn();return Array.isArray(value)?value:[]}catch{return[]}};

  let reconProjectionPending=false;
  let reconProjectionSeenRunning=false;
  let reconProjectionDeadline=0;

  const renderReconSession=(session)=>{
    if(!session)return;
    const status=String(session.status||'idle').toLowerCase();
    const total=Number(session.totalSources||0);
    const completed=Number(session.completedSources||0);
    const candidates=Number(session.candidatesFound||0);
    const unique=Number(session.uniqueHostsFound||0);
    const hosts=Array.isArray(session.discoveredHosts)?session.discoveredHosts:[];
    const percentValue=total>0?Math.round((completed/total)*100):0;

    text('session-status',status.toUpperCase());
    text('session-target',session.target||'—');
    text('session-profile',session.profileId||'—');
    text('session-hosts',unique);
    text('sources',completed+'/'+total);
    text('candidates',candidates);
    text('unique',unique);
    text('host-count',hosts.length);
    text('profile',session.profileId?String(session.profileId).toUpperCase():'NO PROFILE');
    progress(percentValue);

    const state=$('scan-state');
    if(state){
      if(status==='running')state.textContent='Reconnaissance running.';
      else if(status==='completed')state.textContent='Enumeration completed in '+(session.lastElapsedMs??0)+' ms.';
      else if(status==='failed')state.textContent='Reconnaissance failed.';
      else state.textContent='Ready for reconnaissance.';
    }

    const results=$('results');
    if(results){
      results.innerHTML='';
      if(!hosts.length)results.innerHTML='<div class="empty">'+(status==='running'?'Scanning...':'No findings yet.')+'</div>';
      else hosts.forEach(host=>{const row=document.createElement('div');row.className='host';row.textContent=host;results.append(row)});
    }

    const profiles=getReconProfiles();
    const profile=profiles.find(value=>value&&value.id===session.profileId);
    const sourceList=$('source-list');
    if(sourceList){
      sourceList.innerHTML='';
      if(!profile||!Array.isArray(profile.sources)){
        sourceList.innerHTML='<div class="empty">No profile loaded.</div>';
      }else{
        profile.sources.forEach((source,index)=>{
          const active=status==='running'&&index===Math.min(completed,profile.sources.length-1);
          const complete=index<completed;
          const row=document.createElement('div');
          row.className='source'+(active?' active':'')+(complete?' done':'');
          row.innerHTML='<div class="mark"></div><div><div class="source-name"></div><div class="source-desc"></div></div><div class="source-count"></div>';
          row.querySelector('.mark').textContent=complete?'✓':active?'›':'·';
          row.querySelector('.source-name').textContent=source.name;
          row.querySelector('.source-desc').textContent=source.description;
          row.querySelector('.source-count').textContent=complete?(Array.isArray(source.candidates)?source.candidates.length:0)+' found':active?'scanning':'pending';
          sourceList.append(row);
        });
      }
    }
  };

  const projectReconSession=()=>{
    const session=getSession();
    if(!session)return;
    const status=String(session.status||'idle').toLowerCase();
    if(reconProjectionPending){
      if(status==='running')reconProjectionSeenRunning=true;
      if(reconProjectionSeenRunning&&(status==='completed'||status==='failed')){
        reconProjectionPending=false;
        reconProjectionSeenRunning=false;
      }else if(Date.now()>reconProjectionDeadline){
        reconProjectionPending=false;
        reconProjectionSeenRunning=false;
      }else if(status!=='running'){
        return;
      }
    }
    renderReconSession(session);
  };

  let reconProjectionTimer=setInterval(projectReconSession,100);

  const renderPacketSession=(session)=>{
    if(!session)return;
    const status=String(session.status||'idle').toLowerCase();
    const packets=Array.isArray(session.capturedPackets)?session.capturedPackets:[];

    text('capture-status',status.toUpperCase());

    const grid=$('packet-grid');
    if(grid){
      grid.innerHTML='<strong>Proto</strong><strong>Peer</strong><strong>Info</strong>';
      if(!packets.length){
        const empty=document.createElement('div');
        empty.className='empty';
        empty.textContent=status==='running'?'Capturing...':'No packets captured yet.';
        grid.append(empty);
      }else{
        packets.forEach(packet=>{
          const peer=packet.source===session.localHost?packet.destination:packet.source;
          const row=document.createElement('div');
          row.className='packet';
          row.innerHTML='<span></span><span></span><span></span>';
          row.children[0].textContent=packet.protocol;
          row.children[1].textContent=peer;
          row.children[2].textContent=packet.info+' ('+packet.length+'B)';
          grid.append(row);
        });
      }
    }
  };

  let captureProjectionPending=false;
  let captureProjectionDeadline=0;

  const projectCaptureSession=()=>{
    const fn=globalExport('getPacketSession');
    if(!fn)return;
    let session;
    try{session=fn()}catch{return}
    if(!session)return;
    const status=String(session.status||'idle').toLowerCase();
    if(captureProjectionPending){
      if(status==='completed'||status==='failed'){
        captureProjectionPending=false;
      }else if(Date.now()>captureProjectionDeadline){
        captureProjectionPending=false;
      }
    }
    renderPacketSession(session);
  };

  let captureProjectionTimer=setInterval(projectCaptureSession,150);

  const invokeCommand=async(commandLine)=>{
    const fn=globalExport('executeCommand');
    if(fn){await Promise.resolve(fn(commandLine));return true}
    return emitCommandRequest(commandLine)
  };

  const startRecon=(target)=>invokeCommand('recon -d '+target);

  const startCapture=(target)=>{
    const fn=globalExport('startCapture');
    if(fn)return Promise.resolve(fn(target));
    return emitCommandRequest('wireshark -t '+target)?Promise.resolve(true):Promise.resolve(false);
  };

  const bind=()=>{
    const reconForm=$('recon-form');
    const reconButton=$('recon-run');
    const reconTarget=$('recon-target');
    if(reconButton&&!reconButton.dataset.dssDirectBound){
      reconButton.type='button';
      reconButton.dataset.dssDirectBound='true';
      reconButton.addEventListener('click',async()=>{
        const target=reconTarget?.value.trim();
        if(!target||reconButton.disabled)return;
        reconButton.disabled=true;
        const state=$('scan-state');
        const bar=$('bar');
        if(state)state.textContent='Starting reconnaissance.';
        progress(0);
        text('profile','RUNNING');
        text('sources','0/0');
        text('candidates','0');
        text('unique','0');
        const results=$('results');
        const sourceList=$('source-list');
        if(results)results.innerHTML='<div class="empty">Scanning...</div>';
        if(sourceList)sourceList.innerHTML='<div class="empty">Loading profile...</div>';
        reconProjectionPending=true;
        reconProjectionSeenRunning=false;
        reconProjectionDeadline=Date.now()+15000;
        try{
          const ok=await startRecon(target);
          const session=getSession();
          if(session)renderReconSession(session);
          reconProjectionPending=false;
          reconProjectionSeenRunning=false;
          if(!ok){
            if(state)state.textContent='DSS reconnaissance runtime rejected the target.';
            reconButton.disabled=false;
          }else{
            reconButton.disabled=false;
          }
        }catch(error){
          if(state)state.textContent=error instanceof Error?error.message:'Reconnaissance failed.';
          reconButton.disabled=false;
          reconProjectionPending=false;
          reconProjectionSeenRunning=false;
        }
      });
    }

    const commandForm=$('cmd-form');
    const commandButton=$('cmd-run');
    const commandInput=$('cmd-input');
    const commandOutput=$('terminal-output');
    const commandPicker=$('cmd-picker');
    const copyButton=$('copy-terminal');

    const copyTextToClipboard=async(text)=>{
      try{
        if(globalThis.navigator?.clipboard?.writeText){
          await globalThis.navigator.clipboard.writeText(text);
          return true;
        }
      }catch{}
      try{
        const textarea=document.createElement('textarea');
        textarea.value=text;
        textarea.style.position='fixed';
        textarea.style.opacity='0';
        textarea.style.pointerEvents='none';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const copied=document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
      }catch{
        return false;
      }
    };

    if(copyButton&&!copyButton.dataset.dssDirectBound){
      copyButton.dataset.dssDirectBound='true';
      copyButton.addEventListener('click',async()=>{
        if(!commandOutput)return;
        const text=commandOutput.innerText||commandOutput.textContent||'';
        const original=copyButton.textContent;
        const copied=await copyTextToClipboard(text);
        copyButton.textContent=copied?'Copied':'Copy failed';
        setTimeout(()=>{copyButton.textContent=original},1500);
      });
    }

    const DSS_COMMAND_VOCAB=['help','clear','recon','wireshark','nmap','lynx','ping','subfinder'];
    const DSS_PICKER_ITEMS=[
      {label:'nmap',hint:'[ip]',insert:'nmap '},
      {label:'lynx',hint:'<ip-or-url>',insert:'lynx '},
      {label:'subfinder',hint:'-d <domain>',insert:'subfinder -d '},
      {label:'ping',hint:'<ip>',insert:'ping '},
    ];
    let pickerIndex=0;

    const closePicker=()=>{
      if(!commandPicker)return;
      commandPicker.hidden=true;
      commandPicker.innerHTML='';
      delete commandPicker.dataset.items;
    };

    const getVisiblePickerItems=()=>{
      if(!commandPicker||commandPicker.hidden)return[];
      try{return JSON.parse(commandPicker.dataset.items||'[]')}catch{return[]}
    };

    const renderPicker=(query)=>{
      if(!commandPicker)return;
      const items=DSS_PICKER_ITEMS.filter(item=>item.label.startsWith((query||'').toLowerCase()));
      if(!items.length){closePicker();return}
      pickerIndex=Math.min(pickerIndex,items.length-1);
      commandPicker.innerHTML='';
      items.forEach((item,index)=>{
        const row=document.createElement('div');
        row.className='cmd-picker-item'+(index===pickerIndex?' active':'');
        row.innerHTML='<span></span><span class="hint"></span>';
        row.children[0].textContent=item.label;
        row.children[1].textContent=item.hint;
        row.addEventListener('mousedown',event=>{
          event.preventDefault();
          if(commandInput)commandInput.value=item.insert;
          closePicker();
          commandInput?.focus();
        });
        commandPicker.append(row);
      });
      commandPicker.dataset.items=JSON.stringify(items.map(item=>item.insert));
      commandPicker.hidden=false;
    };

    const runAutocomplete=()=>{
      if(!commandInput)return;
      const value=commandInput.value;
      const firstWord=(value.split(/\s+/)[0]||'').toLowerCase();
      if(!firstWord)return;
      const matches=DSS_COMMAND_VOCAB.filter(cmd=>cmd.startsWith(firstWord));
      if(matches.length===1){
        commandInput.value=matches[0]+value.slice(firstWord.length)+(value.trim()===firstWord?' ':'');
      }else if(matches.length>1&&commandOutput){
        const line=document.createElement('div');
        line.className='line line-info';
        line.textContent=matches.join('  ');
        commandOutput.append(line);
      }
    };

    const runCommandFromInput=async()=>{
      if(!commandInput)return;
      const commandLine=commandInput.value.trim();
      if(!commandLine)return;
      closePicker();
      if(commandOutput){const line=document.createElement('div');line.className='line line-info';line.textContent='dss~$ '+commandLine;commandOutput.append(line);while(commandOutput.children.length>500)commandOutput.removeChild(commandOutput.firstChild);commandOutput.scrollTo(0,commandOutput.scrollHeight)}
      commandInput.value='';
      if(commandLine.toLowerCase()==='clear'){
        if(commandOutput)commandOutput.innerHTML='';
        const line=document.createElement('div');
        line.className='line line-info';
        line.textContent='DSS // Data Surveillance System';
        commandOutput?.append(line);
        commandInput?.focus();
        return;
      }
      const leadingWord=commandLine.trim().split(/\s+/)[0]?.toLowerCase()||'';
      const hasOwnResultPanel=leadingWord==='recon'||leadingWord==='subfinder'||leadingWord==='wireshark';

      try{
        const ok=await invokeCommand(commandLine);

        if(!ok&&commandOutput&&!hasOwnResultPanel){
          const resultFn=globalExport('getLastCommandResult');
          const result=resultFn?resultFn():null;
          const line=document.createElement('div');
          line.className='line line-warn';
          line.textContent=(result&&result.message)||'DSS command bridge is unavailable.';
          commandOutput.append(line);
        }else if(ok&&commandOutput&&!hasOwnResultPanel){
          const resultFn=globalExport('getLastCommandResult');
          const result=resultFn?resultFn():null;
          if(result&&result.message&&result.message!=='__DSS_CLEAR__'){
            const line=document.createElement('div');
            line.className='line line-ok';
            line.textContent=result.message;
            commandOutput.append(line);
          }
        }
      }catch(error){
        if(commandOutput){
          const line=document.createElement('div');
          line.className='line line-warn';
          line.textContent=error instanceof Error?error.message:'Command execution failed.';
          commandOutput.append(line);
        }
      }
      if(commandOutput)commandOutput.scrollTo(0,commandOutput.scrollHeight);
      commandInput?.focus();
    };

    if(commandButton&&!commandButton.dataset.dssDirectBound){
      commandButton.type='button';
      commandButton.dataset.dssDirectBound='true';
      commandButton.addEventListener('click',runCommandFromInput);
    }

    if(commandInput&&!commandInput.dataset.dssDirectBound){
      commandInput.dataset.dssDirectBound='true';

      commandInput.addEventListener('input',()=>{
        const value=commandInput.value;
        if(value.startsWith('/'))renderPicker(value.slice(1));
        else closePicker();
      });

      commandInput.addEventListener('keydown',event=>{
        const pickerItems=getVisiblePickerItems();

        if(pickerItems.length&&(event.key==='ArrowDown'||event.key==='ArrowUp')){
          event.preventDefault();
          pickerIndex=event.key==='ArrowDown'
            ? Math.min(pickerIndex+1,pickerItems.length-1)
            : Math.max(pickerIndex-1,0);
          renderPicker(commandInput.value.slice(1));
          return;
        }

        if(pickerItems.length&&event.key==='Escape'){
          event.preventDefault();
          closePicker();
          return;
        }

        if(pickerItems.length&&event.key==='Enter'){
          event.preventDefault();
          commandInput.value=pickerItems[pickerIndex];
          closePicker();
          return;
        }

        if(event.key==='Tab'){
          event.preventDefault();
          runAutocomplete();
          return;
        }

        if(event.key==='Enter'){
          event.preventDefault();
          void runCommandFromInput();
        }
      });
    }

    const captureButton=$('capture-run');
    const captureTarget=$('capture-target');
    if(captureButton&&!captureButton.dataset.dssDirectBound){
      captureButton.dataset.dssDirectBound='true';
      captureButton.addEventListener('click',async()=>{
        if(captureButton.disabled)return;
        const session=getSession();
        const target=(captureTarget?.value||'').trim()||session?.target||'local-network';
        captureButton.disabled=true;
        text('capture-status','RUNNING');
        const grid=$('packet-grid');
        if(grid)grid.innerHTML='<strong>Proto</strong><strong>Peer</strong><strong>Info</strong><div class="empty">Capturing...</div>';
        captureProjectionPending=true;
        captureProjectionDeadline=Date.now()+15000;
        try{
          const ok=await startCapture(target);
          const packetSession=globalExport('getPacketSession')?.();
          if(packetSession)renderPacketSession(packetSession);
          captureProjectionPending=false;
          if(!ok)text('capture-status','FAILED');
        }catch(error){
          text('capture-status','FAILED');
          captureProjectionPending=false;
        }finally{
          captureButton.disabled=false;
        }
      });
    }

    if(reconForm)reconForm.addEventListener('submit',event=>event.preventDefault());
    if(commandForm)commandForm.addEventListener('submit',event=>event.preventDefault());
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});
  else bind();
})();
</script>`;

const dssHTML = appHTML.includes('</body>')
    ? appHTML.replace('</body>', `${DSS_DIRECT_INTERACTION_PATCH}</body>`)
    : `${appHTML}${DSS_DIRECT_INTERACTION_PATCH}`;

@RegisterApp
export class EntityResolutionApp extends App {
    AppName = "dss";
    Title = "DSS";
    Icon = "./assets/dss.svg";
    HTML = dssHTML;
    DefaultSize = { width: 1220, height: 800 };
    override MinSize = { width: 1200, height: 780 };
    override Unlocked = true;

    override Store = {
        title: "DSS",
        ratings: 0,
        description: "DSS // Data Surveillance System — integrated investigation workspace.",
    };

    override Exports = {
        getToolCatalog: (): readonly OpsToolDefinition[] => opsRuntime.tools.getAll(),
        getCommandCatalog: (): readonly OpsCommandDefinition[] => opsRuntime.commands.getAll(),
        getSession: (): OpsSessionSnapshot => opsRuntime.session.getSnapshot(),
        getReconProfiles: (): readonly ReconProfile[] => opsRuntime.recon.getProfiles(),
        startRecon: (target: string): Promise<boolean> => executeDssCommand(`recon -d ${target}`),
        executeCommand: (commandLine: string): Promise<boolean> => executeDssCommand(commandLine),
        getPacketSession: (): PacketSessionSnapshot => opsRuntime.packetSession.getSnapshot(),
        startCapture: (target: string): Promise<boolean> => executeDssCommand(`wireshark -t ${target}`),
        getLastCommandResult: (): DssCommandResultSnapshot => getLastCommandResult(),
    };
}
