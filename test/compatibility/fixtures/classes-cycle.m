% Concatenate after test/node/fixtures/resumable-classes.m.
global classTrace;
classTrace=0; box=RetainedBox();
set(box,"Value",7); value=get(box,"Value");
property_ok=value==7 && classTrace==3412;
classTrace=0;
listener=addlistener(box,"Changed",@classListener);
box.notify("Changed");
event_ok=classTrace==56;
classTrace=0;
indexed=RetainedIndexed();
[~,second]=indexed(3);
index_ok=second==23 && classTrace==97;
classTrace=0;
indexed(3)=20;
write_ok=peek(indexed)==23 && classTrace==8;
classTrace=0;
boxes=[box,RetainedBox()];
values=boxes.waitPeek();
array_ok=isequal(values,[7,1]) && classTrace==11;
classTrace=0;
a=RetainedConcat(); b=RetainedConcat();
value=[a,b];
concat_ok=value==2 && classTrace==2;
property_ok && event_ok && index_ok && write_ok && array_ok && concat_ok
