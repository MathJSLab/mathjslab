clear % clear all variables

global a b c
test_result_global(1,1) = true

global g
test_result_global(2,1) = true
g = 10

function y = readg()
  global g
  y = g
end

test_result_global(3,1) = isequal(readg(), readg())

function setg(x)
  global g
  g = x
end

test_result_global(4,1) = isequal(setg(7), setg(7))
test_result_global(5,1) = isequal(g, g)


complete_test_result_global = all(test_result_global)

complete_test_result_global
