% Concatenate after test/node/fixtures/resumable-dynamic.m.
global dynamicTrace dynamicCalls;
dynamicTrace=0; dynamicCalls=0;
local_ok=dynamicLocal()==3 && dynamicOuter()==3;
[a,b]=eval("dynamicPair()");
pair_ok=a==10 && b==21 && dynamicCalls==1;
[text,~,b]=evalc("dynamicPair()");
capture_ok=isequal(text,"20") && b==20 && dynamicCalls==2;
eval("value=1; pause(0); error('recover');","pause(0); value+=2;");
catch_ok=value==3;
dynamicTrace=0;
A=0; C={0}; total=0;
for [A(dynamicStep(1,1)),C{dynamicStep(1,2)}]=[2,4;3,5]
  total+=A(1)+C{1};
end
binding_ok=A==4 && C{1}==5 && total==14 && dynamicTrace==2121;
dynamicTrace=0; spmdIndex=9; spmdSize=7;
spmd(dynamicStep(0,1),dynamicStep(2,2))
  workerValue=spmdIndex+spmdSize;
  pause(0);
end
workers_ok=workerValue==2 && spmdIndex==9 && spmdSize==7 && dynamicTrace==12;
local_ok && pair_ok && capture_ok && catch_ok && binding_ok && workers_ok
