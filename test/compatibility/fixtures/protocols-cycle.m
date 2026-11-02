% Concatenate after test/node/fixtures/resumable-protocols.m.
global protocolTrace;
protocolTrace=0; p=RetainedProtocol(1); conditionValue=0;
if p, conditionValue=7; end
condition_ok=conditionValue==7 && protocolTrace==1;
protocolTrace=0; p=RetainedProtocol(0); A=[7,8]; A(p)=9;
index_ok=isequal(A,[9,8]) && protocolTrace==3;
protocolTrace=0; p=RetainedProtocol(2); [~,second]=feval("size",p);
builtin_ok=second==2 && protocolTrace==5;
protocolTrace=0; values=[RetainedProtocol(1),RetainedProtocol(2)]; result=values+[10;20];
operator_ok=isequal(result,[11,12;21,22]) && protocolTrace==6666;
protocolTrace=0; first=RetainedProtocol(2); second=RetainedProtocol(3); methodsCell={first.double,second.double};
[~,value]=subsref(methodsCell,substruct("{}",{":"},"()",{}));
tail_ok=value==3 && protocolTrace==44;
protocolTrace=0; p=RetainedProtocol(2); p+=3;
compound_ok=p==5 && protocolTrace==6;
protocolTrace=0; selected=nthargout(2,@protocolPair);
selection_ok=selected==102 && protocolTrace==9;
protocolTrace=0; mapped=spfun(@protocolMap,[1,0;2,3]);
mapping_ok=isequal(mapped,[2,0;4,6]) && protocolTrace==123;
condition_ok && index_ok && builtin_ok && operator_ok && tail_ok && compound_ok && selection_ok && mapping_ok
