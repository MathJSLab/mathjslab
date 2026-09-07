clear % clear all variables
a = 1
b = -10
c = 21
f = @(x) a*x^2+b*x+c
test_result_function_definition(1,1) = isequal(f(3), f(3))
test_result_function_definition(2,1) = isequal(f(7), f(7))
test_result_function_definition(3,1) = isequal(f(2), f(2))
test_result_function_definition(4,1) = isequal(f, f)

clear % clear all variables
sin %% error
z = @sin
test_result_function_definition(5,1) = isequal(z, z)
test_result_function_definition(6,1) = isequal(sin(3), sin(3))
test_result_function_definition(7,1) = isequal(z(3), z(3))

clear % clear all variables
a = 5
test_result_function_definition(8,1) = isequal(a, a)
sum(i, 1, 3, i)
test_result_function_definition(9,1) = isequal(sin(0), sin(0))
sin = 10
test_result_function_definition(10,1) = isequal(sin, sin)

clear % clear all variables
sin % error
f = sin %error
test_result_function_definition(11,1) = isequal(sin(2), sin(2))
test_result_function_definition(12,1) = isequal(cos(0), cos(0))
f = @sin
test_result_function_definition(13,1) = isequal(f(2), f(2))
g = @(x)x^2
test_result_function_definition(14,1) = isequal(g(3), g(3))
a = [1 2 3]
test_result_function_definition(15,1) = isequal(a(2), a(2))
test_result_function_definition(16,1) = isequal((a)(2), (a)(2))
test_result_function_definition(17,1) = isequal((@sin)(2), (@sin)(2))

clear % clear all variables
function y = f(x) % Simple function
  y = x^2;
end
test_result_function_definition(18,1) = isequal(f(2), f(2))
function [a,b] = f(x) % Two return values
  a = x;
  b = x^2;
end
[a, b] = f(3)
function z = f(x,y) % Two parameters
  z = x + y;
end
test_result_function_definition(19,1) = isequal(f(2,3), f(2,3))
function y = f(x) % Use of internal variable
  a = x + 1;
  y = a * 2;
end
test_result_function_definition(20,1) = isequal(f(5), f(5))

clear % clear all variables
function y = f(x) % start stack trace error test
  y = g(x);
end
function z = g(x)
  z = h(x);
end
function w = h(x)
  w = x + unknownVar;
end
f(2) % error: show stack trace
unknownVar = 1
test_result_function_definition(21,1) = isequal(f(2), f(2))
unknownVar = 3
function w = h(x)
  w = x + unknownVar;
end
test_result_function_definition(22,1) = isequal(f(2), f(2))
unknownVar = 1
test_result_function_definition(23,1) = isequal(f(2), f(2))


complete_test_result_function_definition = all(test_result_function_definition)

complete_test_result_function_definition
