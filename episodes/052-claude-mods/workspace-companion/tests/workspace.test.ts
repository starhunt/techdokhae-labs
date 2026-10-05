import {expect,test,mock} from 'claude-code/testing';
function world(on) {
 const saved = new Map([['mode','Review']]);
 on('store.get',($,e)=>({value:saved.get(e.key)}));on('store.set',($,e)=>{saved.set(e.key,e.value);return {value:undefined}});
 for(const name of ['ui.status','ui.invalidate','ui.log','ui.toast'])on(name,()=>({value:undefined}));
 on('command.register',($,e)=>({value:{command:e.name}}));
 on('process.run',()=>({value:{exitCode:0,stdout:'PROJECT: Tiny Cart\nNOTE: Keep exported names.',stderr:''}}));
 on('session.start',($,e)=>({cwd:e.cwd}));return saved;
}
const PANE={plugin:'workspace-companion',component:'Pane',requestId:'workbench',surface:'terminal',viewport:{columns:154,rows:36},props:{title:'Workspace',isFocused:true,bodyColumns:52,placement:'sidebar',scroll:{offset:0,bodyRows:13},view:{}}} as const;
test('panel selection persists and context can be toggled without rewriting typed text',async($,on)=>{
 const saved=world(on);let seen;on('prompt.submit',($,e)=>{seen=e;return {text:e.text}});
 await $.session.start({surface:'terminal',isInteractive:true,cwd:'/demo'});
 const ui=await $.ui.mount(PANE);await ui.press({key:'build'});await ui.press({key:'context'});
 expect(saved.get('mode')).toBe('Build');
 await $.prompt.submit({text:'Read cart.mjs',context:['existing context']});
 expect(seen.text).toBe('Read cart.mjs');expect(seen.context[0]).toBe('existing context');expect(seen.context[1]).toContain('Selected work mode: Build');expect(seen.context[1]).toContain('PROJECT: Tiny Cart');
 await ui.press({key:'context'});await $.prompt.submit({text:'Next',context:['keep']});expect(seen.context).toEqual(['keep']);await ui.unmount();
});
test('foreign panes pass through, while the shared prompt strip preserves another drawing',async($,on)=>{
 world(on);on('ui.render',()=>({type:'Text',props:{},children:['native-or-other-mod']}));
 const foreign=await $.ui.mount({...PANE,requestId:'another-pane'});expect(await foreign.find({type:'Text',text:'native-or-other-mod'})).toBeDefined();await foreign.unmount();
 const shared=await $.ui.mount({...PANE,component:'AbovePrompt'});expect(await shared.find({type:'Text',text:'native-or-other-mod'})).toBeDefined();expect(await shared.find({type:'Text',text:/WORKSPACE/})).toBeDefined();await shared.unmount();
});
test('failed edits remain failures and only a successful edit enters the change list',async($,on)=>{
 world(on);let failure=true;on('tool.call',()=>failure?{result:'failed',isError:true}:{result:'done'});
 expect(await $.tool.call({tool:'Edit',file_path:'/demo/cart.mjs',old_string:'a',new_string:'b'})).toMatchObject({isError:true});
 let status=JSON.parse((await $.command.run({command:'work-status',args:''})).text);expect(status.changed).toEqual([]);
 failure=false;await $.tool.call({tool:'Edit',file_path:'/demo/cart.mjs',old_string:'a',new_string:'b'});
 status=JSON.parse((await $.command.run({command:'work-status',args:''})).text);expect(status.changed).toEqual(['cart.mjs']);expect(status.calls).toBe(2);
});
test('spinner decoration retains native properties',async($,on)=>{
 world(on);let seen;on('ui.render',($,e)=>{seen=e;return {type:'Text',props:{},children:['native spinner']}});
 const ui=await $.ui.mount({...PANE,component:'Spinner',props:{word:'Working',message:'Working',suffix:'…',mode:'thinking',isBusy:true}});
 expect(seen.props.message).toBe('Working');expect(seen.props.isBusy).toBe(true);expect(seen.props.suffix).toContain('tools 0');expect(await ui.find({type:'Text',text:'native spinner'})).toBeDefined();await ui.unmount();
});
