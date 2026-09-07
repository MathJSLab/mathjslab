clear

test_result_mfilename(1,1) = isequal(mfilename(), mfilename())

function y = currentname()
  y = mfilename();
end

test_result_mfilename(2,1) = isequal(currentname(), currentname())

function y = currentnamefullpath()
  y = mfilename("fullpath");
end

test_result_mfilename(3,1) = isequal(currentnamefullpath(), currentnamefullpath())

function y = currentnameclass()
  y = mfilename("class");
end

test_result_mfilename(4,1) = isequal(currentnameclass(), currentnameclass())

function y = outermfilename()
  y = mfilename();
end

test_result_mfilename(5,1) = isequal(outermfilename(), outermfilename())

function y = nestedmfilename()
  y = inner();
  function z = inner()
    z = mfilename();
  end
end

test_result_mfilename(6,1) = isequal(nestedmfilename(), nestedmfilename())

function [a, b] = bothmfilename()
  a = mfilename();
  b = inner();
  function z = inner()
    z = mfilename("fullpath");
  end
end

[a, b] = bothmfilename()

function h = makemfilenamehandle()
  function y = inner()
    y = mfilename();
  end
  h = @inner;
end

h = makemfilenamehandle()
test_result_mfilename(7,1) = isequal(h(), h())

function y = callmfilenamehandle(f)
  y = f();
end

test_result_mfilename(8,1) = isequal(callmfilenamehandle(h), callmfilenamehandle(h))


complete_test_result_mfilename = all(test_result_mfilename)

complete_test_result_mfilename
