function classMark(tag)
  global classTrace;
  classTrace=10*classTrace+tag;
end
function classListener(source,data)
  classMark(5);
  pause(0);
  classMark(6);
end
classdef RetainedBox < matlab.mixin.SetGet
  properties (Access=private)
    backing=1;
  end
  properties (Dependent, GetObservable, SetObservable)
    Value;
  end
  properties (AbortSet, SetObservable)
    Normal=0;
  end
  events
    Changed;
  end
  methods
    function value=get.Value(obj)
      classMark(1);
      pause(0);
      classMark(2);
      value=obj.backing;
    end
    function obj=set.Value(obj,value)
      classMark(3);
      pause(0);
      obj.backing=value;
      classMark(4);
    end
    function fire(obj)
      notify(obj,"Changed");
    end
    function value=waitPeek(obj)
      classMark(1);
      pause(0);
      value=obj.backing;
    end
    function value=peek(obj)
      value=obj.backing;
    end
  end
end

classdef RetainedIndexed < handle
  properties
    x=10;
  end
  methods
    function n=end(obj,k,count)
      classMark(6);
      pause(0);
      n=2;
    end
    function n=numArgumentsFromSubscript(obj,s,context)
      classMark(9);
      pause(0);
      n=2;
    end
    function [a,b]=subsref(obj,s)
      classMark(7);
      pause(0);
      a=obj.x+s(1).subs{1};
      b=a+10+100*isargout(1);
    end
    function obj=subsasgn(obj,s,value)
      classMark(8);
      pause(0);
      obj.x=value+s(1).subs{1};
    end
    function value=peek(obj)
      value=obj.x;
    end
  end
end

classdef RetainedConcat < handle
  properties
    x=1;
  end
  methods
    function value=horzcat(a,b)
      classMark(2);
      pause(0);
      value=a.x+b.x;
    end
    function value=vertcat(a,b)
      classMark(3);
      pause(0);
      value=a.x+b.x+10;
    end
  end
end

classdef RetainedDisposable < handle
  methods
    function delete(obj)
      classMark(4);
      pause(0);
    end
  end
end

classdef RetainedValue
  properties (Access=private)
    backing=1;
  end
  properties (Dependent)
    Value;
  end
  methods
    function value=get.Value(obj)
      classMark(1);
      pause(0);
      classMark(2);
      value=obj.backing;
    end
    function obj=set.Value(obj,value)
      classMark(3);
      pause(0);
      obj.backing=value;
      classMark(4);
    end
    function value=peek(obj)
      value=obj.backing;
    end
  end
end

function value=classIndex()
  classMark(6);
  pause(0);
  value=1;
end
classdef RetainedVectorBox
  properties (Access=private)
    backing=[1,2,3];
  end
  properties (Dependent)
    Values;
  end
  methods
    function value=get.Values(obj)
      classMark(1);
      pause(0);
      classMark(2);
      value=obj.backing;
    end
    function obj=set.Values(obj,value)
      classMark(3);
      pause(0);
      obj.backing=value;
      classMark(4);
    end
    function value=peek(obj)
      value=obj.backing;
    end
  end
end

classdef RetainedPrivateEnd
  properties (Access=private)
    data=[1,2,3];
  end
  methods
    function y=subsref(obj,s)
      classMark(7);
      pause(0);
      y=obj.data(end);
    end
    function obj=trim(obj)
      classMark(6);
      pause(0);
      obj.data(end)=0;
    end
    function y=values(obj)
      y=obj.data;
    end
  end
end
