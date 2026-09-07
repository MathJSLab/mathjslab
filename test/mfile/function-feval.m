clear % clear all variables

test_result_function_feval(1,1) = isequal(feval(@sin, 0), feval(@sin, 0))

test_result_function_feval(2,1) = isequal(feval("sin", 0), feval("sin", 0))

f = @cos
test_result_function_feval(3,1) = isequal(feval(f, 0), feval(f, 0))

g = @(x) x + 1
test_result_function_feval(4,1) = isequal(feval(g, 4), feval(g, 4))

test_result_function_feval(5,1) = isequal(feval("@(x) x + 1", 4), feval("@(x) x + 1", 4))

function y = twice(x)
  y = 2 * x;
end

test_result_function_feval(6,1) = isequal(feval(@twice, 5), feval(@twice, 5))
test_result_function_feval(7,1) = isequal(feval("twice", 6), feval("twice", 6))

function [a, b] = pair(x)
  a = nargout;
  b = x + 1;
end

x = feval(@pair, 10)
[x, y] = feval("pair", 10)

function h = makefevalnested(a)
  function z = inner(x)
    z = x + a;
  end
  h = @inner;
end

h = makefevalnested(10)
test_result_function_feval(8,1) = isequal(feval(h, 5), feval(h, 5))

function h = makefevalcounter()
  c = 0;
  function z = bump()
    c = c + 1;
    z = c;
  end
  h = @bump;
end

counter = makefevalcounter()
test_result_function_feval(9,1) = isequal(feval(counter), feval(counter))
test_result_function_feval(10,1) = isequal(feval(counter), feval(counter))
test_result_function_feval(11,1) = isequal(feval(counter), feval(counter))

function callnooutput(f, x)
  feval(f, x);
end

function showvalue(x)
  y = x + 1
end

test_result_function_feval(12,1) = isequal(callnooutput(@showvalue, 9), callnooutput(@showvalue, 9))

clear

f = @(x, y) nargin + nargout
test_result_function_feval(13,1) = isequal(feval(f, 1, 2), feval(f, 1, 2))

f = @(x) inputname(1)
source = 10
test_result_function_feval(14,1) = isequal(feval(f, source), feval(f, source))
test_result_function_feval(15,1) = isequal(feval(f, 10), feval(f, 10))

test_result_function_feval(16,1) = isequal(feval("@(x) inputname(1)", source), feval("@(x) inputname(1)", source))
test_result_function_feval(17,1) = isequal(feval("@(x) inputname(1)", 10), feval("@(x) inputname(1)", 10))

function y = fevalinputname(x)
  y = inputname(1);
end

source2 = 20
test_result_function_feval(18,1) = isequal(feval(@fevalinputname, source2), feval(@fevalinputname, source2))
test_result_function_feval(19,1) = isequal(feval("fevalinputname", source2), feval("fevalinputname", source2))
test_result_function_feval(20,1) = isequal(feval(@fevalinputname, 20), feval(@fevalinputname, 20))

function y = readcallerx()
  y = evalin("caller", "x");
end

g = @(x) readcallerx()
test_result_function_feval(21,1) = isequal(feval(g, 30), feval(g, 30))

function y = fevaloutercaller()
  x = 7;
  f = @(t) evalin("caller", "x + t");
  y = feval(f, 3);
end

test_result_function_feval(22,1) = isequal(fevaloutercaller(), fevaloutercaller())

function f = makefevalnested(offset)
  function z = inner(x)
    z = x + offset;
  end
  f = @inner;
end

h = makefevalnested(100)
test_result_function_feval(23,1) = isequal(feval(h, 5), feval(h, 5))

function [a, b] = fevalpairmeta(x)
  a = nargout;
  b = inputname(1);
end

value = 40
a = feval(@fevalpairmeta, value)
[a, b] = feval(@fevalpairmeta, value)

feval(123, 1)          % erro esperado: primeiro argumento inválido
test_result_function_feval(24,1) = isequal(feval("@(x) x + 1", 4), feval("@(x) x + 1", 4))


complete_test_result_function_feval = all(test_result_function_feval)

complete_test_result_function_feval
