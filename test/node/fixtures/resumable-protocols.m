function protocolMark(tag)
 global protocolTrace;
 protocolTrace=10*protocolTrace+tag;
end
classdef RetainedProtocol < handle
 properties
  value=0;
 end
 methods
  function obj=RetainedProtocol(value)
   obj.value=value;
  end
  function value=logical(obj)
   protocolMark(1);
   pause(0);
   value=obj.value>0;
  end
  function value=eq(obj,other)
   protocolMark(2);
   pause(0);
   value=obj.value==other;
  end
  function value=subsindex(obj)
   protocolMark(3);
   pause(0);
   value=obj.value;
  end
  function value=plus(obj,other)
   protocolMark(6);
   pause(0);
   value=obj.value+other;
  end
  function value=uminus(obj)
   protocolMark(7);
   pause(0);
   value=-obj.value;
  end
  function value=colon(obj,stop)
   protocolMark(8);
   pause(0);
   value=[obj.value,stop];
  end
  function value=double(obj)
   protocolMark(4);
   pause(0);
   value=obj.value;
  end
  function [a,b]=size(obj)
   protocolMark(5);
   pause(0);
   a=1;
   b=obj.value+100*isargout(1);
  end
 end
end

classdef ProtocolContainer < handle
 methods
  function value=apply(obj,arg)
   value=double(arg);
  end
 end
 properties
  values=[7,8];
 end
 events
  Changed;
 end
end

classdef MutatingProtocolIndex
 methods
  function value=subsindex(obj)
   global protocolA;
   protocolMark(3);
   pause(0);
   protocolA(2)=99;
   value=0;
  end
 end
end

function [a,b]=protocolPair()
 protocolMark(9);
 pause(0);
 a=1+100*isargout(1);
 b=2+100*isargout(2);
end
function value=protocolMap(value)
 protocolMark(value);
 pause(0);
 value=2*value;
end
function value=protocolBadMap(value)
 protocolMark(7);
 pause(0);
 value=[value,value];
end
