function value = validationStep(value, tag)
  global validationTrace;
  validationTrace = 10*validationTrace + tag;
  pause(0);
end

function validationCheck(value)
  global validationTrace validationCleanup;
  validationTrace = 10*validationTrace + 2;
  unwind_protect
    pause(0);
    if any(value < 0)
      error("validation rejected value");
    end
  unwind_protect_cleanup
    validationCleanup += 1;
  end_unwind_protect
end

function y = validated(x)
  arguments
    x double {validationCheck, mustBeGreaterThan(x, validationStep(0,3))} = validationStep(3,1)
  end
  arguments (Output)
    y double {validationCheck}
  end
  global validationTrace;
  validationTrace = 10*validationTrace + 4;
  y = x+1;
end

function y = validatedRepeating(varargin)
  arguments (Repeating)
    row (1,n) double {validationCheck(row), mustBeGreaterThan(row,validationStep(0,3))}
  end
  y = nargin;
end

function [a,b] = validatedMasked()
  arguments (Output)
    a double {validationCheck}
    b double {validationCheck}
  end
  a=-1; b=3;
end

function out = validatedRepeatingOutput()
  arguments (Output,Repeating)
    out double {validationCheck(out)}
  end
  out={-1,3,4};
end

function y = validatedNamed(options)
  arguments
    options.Factor double {validationCheck, mustBeGreaterThan(options.Factor,validationStep(0,3))} = validationStep(3,1)
  end
  y=options.Factor;
end

classdef ValidationBox < handle
  properties
    x double {validationCheck} = validationStep(1,1)
  end
end

classdef ValidationValueBox
  properties
    x double {validationCheck} = validationStep(1,1)
  end
end
