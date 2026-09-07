clear % clear all variables

test_result_which(1,1) = isequal(which("missing_name"), which("missing_name"))
which missing_name
test_result_which(2,1) = true

x = 1
test_result_which(3,1) = isequal(which("x"), which("x"))
which x
test_result_which(4,1) = true

function y = whichuser(x)
  y = x;
end

test_result_which(5,1) = isequal(which("whichuser"), which("whichuser"))
which whichuser
test_result_which(6,1) = true

test_result_which(7,1) = isequal(which("sin"), which("sin"))
which sin
test_result_which(8,1) = true

f = @sin
test_result_which(9,1) = isequal(which(f), which(f))

g = @(x) x + 1
test_result_which(10,1) = isequal(which(g), which(g))

function h = makewhichnested()
  function y = inner(x)
    y = x;
  end
  h = @inner;
end

h = makewhichnested()
test_result_which(11,1) = isequal(which(h), which(h))

test_result_which(12,1) = isequal(which("inner"), which("inner"))
which inner
test_result_which(13,1) = true

function y = outerwhich()
  y = exist("inner");
  which inner
  function z = inner()
    z = 1;
  end
end

test_result_which(14,1) = isequal(outerwhich(), outerwhich())


complete_test_result_which = all(test_result_which)

complete_test_result_which
