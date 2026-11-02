function value=dynamicStep(value,tag)
  global dynamicTrace dynamicCalls;
  dynamicTrace=10*dynamicTrace+tag;
  dynamicCalls+=1;
  pause(0);
end

function [a,b]=dynamicPair()
  global dynamicCalls;
  dynamicCalls+=1;
  pause(0);
  a=10;
  b=20+isargout(1);
end

function value=dynamicLocal()
  localValue=1;
  eval("pause(0); localValue+=2;");
  value=localValue;
end

function dynamicCaller()
  evalin("caller","pause(0); callerValue+=2;");
end

function value=dynamicOuter()
  callerValue=1;
  dynamicCaller();
  value=callerValue;
end

function dynamicPositive(value)
  global dynamicTrace;
  dynamicTrace=10*dynamicTrace+2;
  pause(0);
  if value<0
    error("dynamic property rejected");
  end
end

classdef DynamicBox < handle
  properties
    value double {dynamicPositive}=1;
  end
end
