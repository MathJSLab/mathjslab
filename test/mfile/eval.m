clear

x = 10
test_result_eval(1,1) = isequal(eval("y = x + 1"), eval("y = x + 1"))
test_result_eval(2,1) = isequal(y, y)

test_result_eval(3,1) = isequal(eval("z = x + y"), eval("z = x + y"))
test_result_eval(4,1) = isequal(z, z)

test_result_eval(5,1) = isequal(eval("w = 2; q = w + z"), eval("w = 2; q = w + z"))
test_result_eval(6,1) = isequal(w, w)
test_result_eval(7,1) = isequal(q, q)

function y = evalinside(x)
  eval("z = x + 1");
  y = z;
end

test_result_eval(8,1) = isequal(evalinside(10), evalinside(10))
test_result_eval(9,1) = isequal(exist("z", "var"), exist("z", "var"))

function [y, localName] = evalcreateslocal(x)
  eval("localValue = x + 5");
  y = localValue;
  localName = inputname(1);
end

a = 20
[y, localName] = evalcreateslocal(a)
test_result_eval(10,1) = isequal(exist("localValue", "var"), exist("localValue", "var"))

function y = evalnested()
  x = 1;
  inner();
  y = x;

  function inner()
    eval("x = x + 4");
  end
end

test_result_eval(11,1) = isequal(evalnested(), evalnested())

function y = evalnestedlocal()
  inner();
  y = exist("createdInsideInner", "var");

  function inner()
    eval("createdInsideInner = 33");
  end
end

evalnestedlocal()

function y = evalwithcaller()
  x = 5;
  y = eval("x + 10");
end

test_result_eval(12,1) = isequal(evalwithcaller(), evalwithcaller())

function y = evalcallsfunction(x)
  eval("t = helper(x)");
  y = t;

  function z = helper(v)
    z = v * 2;
  end
end

test_result_eval(13,1) = isequal(evalcallsfunction(8), evalcallsfunction(8))

function y = evalusespersistent()
  persistent count = 0;
  eval("count = count + 1");
  y = count;
end

test_result_eval(14,1) = isequal(evalusespersistent(), evalusespersistent())
test_result_eval(15,1) = isequal(evalusespersistent(), evalusespersistent())

test_result_eval(16,1) = isequal(eval("baseEvalValue = 123"), eval("baseEvalValue = 123"))
test_result_eval(17,1) = isequal(baseEvalValue, baseEvalValue)

eval(1)           % erro: chamada invalida
test_result_eval(18,1) = isequal(eval("1", "2"), eval("1", "2"))


complete_test_result_eval = all(test_result_eval)

complete_test_result_eval
