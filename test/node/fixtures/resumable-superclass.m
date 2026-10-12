classdef ResumeRoot < handle
properties (Access=private)
secret=0;
end
properties (Access=protected)
value=0;
end
properties
marker=0;
end
methods
function obj=ResumeRoot(v=0)
global trace;
trace=trace*10+1;
if v>0, pause(0.001); end
obj.secret=v; obj.value=v; obj.marker=v;
end
end
methods (Access=protected)
function [a,b]=read(obj,v)
global trace;
trace=trace*10+4;
pause(0.002);
if v<0, error('superclass resumed failure'); end
a=obj.secret+v; b=obj.value;
end
end
methods (Access=private)
function y=privateRead(obj)
y=obj.secret;
end
end
end
classdef ResumeMiddle < ResumeRoot
methods
function obj=ResumeMiddle(v=0)
obj=obj@ResumeRoot(v);
global trace; trace=trace*10+2;
obj.value+=10;
end
end
methods (Access=protected)
function [a,b]=read(obj,v)
[a,b]=read@ResumeRoot(obj,v);
a+=10;
end
end
end
classdef ResumeLeaf < ResumeMiddle
methods
function obj=ResumeLeaf(v=0)
obj=obj@ResumeMiddle(v);
global trace; trace=trace*10+3;
obj.value+=100;
end
function [a,b]=collect(obj,v)
[a,b]=read@ResumeMiddle(receiver(obj),v);
a+=100;
end
function y=receiver(obj)
global receivers; receivers+=1;
pause(0.003);
y=obj;
end
function y=denied(obj)
y=privateRead@ResumeRoot(obj);
end
end
end
