clear % clear all variables

function y = counter()
  persistent c = 0;
  c = c + 1;
  y = c;
end

test_result_persistent(1,1) = isequal(counter(), counter())
test_result_persistent(2,1) = isequal(counter(), counter())
test_result_persistent(3,1) = isequal(counter(), counter())

c % error: it does not leak into the global scope.

function y = counter()
  persistent c = 0;
  c = c + 1;
  y = c;
end

test_result_persistent(4,1) = isequal(counter(), counter())

function y = acc(x)
  persistent total = 0;
  total = total + x;
  y = total;
end

test_result_persistent(5,1) = isequal(acc(5), acc(5))
test_result_persistent(6,1) = isequal(acc(3), acc(3))
test_result_persistent(7,1) = isequal(acc(-2), acc(-2))

persistent c % error: persistent declaration is only valid inside a function.


complete_test_result_persistent = all(test_result_persistent)

complete_test_result_persistent
