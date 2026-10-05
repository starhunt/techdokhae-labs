const PANE = 'workbench';
let mode = 'Build';
let calls = 0;
let turns = 0;
let tab = 'brief';
let inject = false;
let brief = 'PROJECT: Tiny Cart\nGOAL: Explain changes before editing.\nNOTE: Preserve the existing exported function name.';
const changed = new Set();
const redraw = $ => $.ui.invalidate('ui.render');
async function choose($, value) {
  mode = value;
  await $.store.set('mode', mode);
  $.ui.status(`Workspace mode: ${mode}`);
  redraw($);
}
export function register(on) {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get('mode');
    if (saved === 'Build' || saved === 'Review') mode = saved;
    const file = await $.process.run(['cat', 'brief.txt'], { cwd: e.cwd, timeoutMs: 2000 });
    if (file.exitCode === 0) brief = file.stdout.trim();
    for (const name of ['workbench','brief-on','brief-off','work-status']) {
      await $.command.register({name, description: 'Workspace companion: ' + name, immediate: true});
    }
    $.ui.status(`Workspace mode: ${mode}`);
    return next(e);
  });
  on('command.run', {command:'workbench'}, async $ => {
    await $.ui.open({id:PANE,title:'Workspace companion',focus:true,closeOnEscape:true,rows:13,columns:52});
    return {};
  });
  on('command.run', {command:'brief-on'}, async $ => {
    inject=true; redraw($); $.ui.toast('Work brief enabled for your next messages');
    return {text:'Brief ON: ' + brief};
  });
  on('command.run', {command:'brief-off'}, async $ => {inject=false;redraw($);return {text:'Brief OFF'};});
  on('command.run', {command:'work-status'}, async () => ({text:JSON.stringify({mode,inject,calls,turns,changed:[...changed]})}));
  on('prompt.submit', async ($, e, next) => {
    if (!inject) return next(e);
    $.ui.log(`Adding visible work brief (${mode}) to this prompt's context`);
    return next({...e,context:[...(e.context??[]),`Selected work mode: ${mode}\n${brief}`]});
  });
  on('tool.call', async ($, e, next) => {
    calls++;redraw($);
    const result=await next(e);
    if (!result.deny && !result.isError && ['Edit','Write'].includes(e.tool) && e.file_path) {
      changed.add(e.file_path.split('/').pop());
      $.ui.log('Changed file: ' + e.file_path.split('/').pop());
    }
    redraw($);return result;
  });
  on('turn.complete', async ($, e, next) => {
    turns++; $.ui.toast(`Turn finished · tools ${calls} · changed ${changed.size}`,{timeoutMs:7000});
    redraw($);return next(e);
  });
  on('ui.render',{component:'Spinner'},async ($,e,next)=>next({...e,props:{...e.props,suffix:` · ${mode} · tools ${calls}`}}));
  on('ui.render',{component:'AbovePrompt'},async ($,e,next)=>{
    const previous=await next(e);const {Box,Text}= $.ui.resolve(e);
    return Box({flexDirection:'column',children:[previous,Text({color:'cyan',children:[`WORKSPACE  ${mode} | brief ${inject?'ON':'OFF'} | ${calls} tool calls | ${changed.size} changed files`]})]});
  });
  on('ui.render',{component:'Pane'},async ($,e,next)=>{
    if(e.requestId!==PANE)return next(e);
    const {Box,Text,Button}= $.ui.resolve(e);
    const button=(key,label,hotkey,fn)=>Button({key,label,hotkey,onPress:fn});
    return Box({flexDirection:'column',children:[
      Text({bold:true,color:'cyan',children:['MY WORKSPACE']}),
      Box({flexDirection:'row',columnGap:2,children:[button('brief','Brief','1',()=>{tab='brief';redraw($)}),button('changes','Changes','2',()=>{tab='changes';redraw($)})]}),
      Text({children:[' ']}),
      ...(tab==='brief' ? [
        ...brief.split('\n').map(line=>Text({children:[line]})),
        Text({children:[' ']}),
        Text({bold:true,children:['MODE: '+mode]}),
        Box({flexDirection:'row',columnGap:2,children:[button('build','Build','b',()=>choose($,'Build')),button('review','Review','r',()=>choose($,'Review'))]}),
        button('context',inject?'Brief context: ON':'Brief context: OFF','c',()=>{inject=!inject;redraw($);$.ui.toast(inject?'Work brief enabled':'Work brief disabled')})
      ]:[Text({bold:true,children:['CHANGED IN THIS SESSION']}),...([...changed].length?[...changed]:['No Edit/Write recorded yet.']).map(line=>Text({children:[line]})),Text({children:[`Tools observed: ${calls} | turns: ${turns}`]})])
    ]});
  });
}
