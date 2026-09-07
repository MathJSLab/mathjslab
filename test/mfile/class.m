clear

test_result_class(1,1) = isequal(class(1), class(1))
test_result_class(2,1) = isequal(class([1, 2, 3]), class([1, 2, 3]))
test_result_class(3,1) = isequal(class([1; 2; 3]), class([1; 2; 3]))

test_result_class(4,1) = isequal(class("abc"), class("abc"))
test_result_class(5,1) = isequal(class('abc'), class('abc'))

test_result_class(6,1) = isequal(class({1, 2, 3}), class({1, 2, 3}))

s = struct()
test_result_class(7,1) = isequal(class(s), class(s))

f = @sin
test_result_class(8,1) = isequal(class(f), class(f))

g = @(x) x + 1
test_result_class(9,1) = isequal(class(g), class(g))

test_result_class(10,1) = isequal(isa(1, "double"), isa(1, "double"))
test_result_class(11,1) = isequal(isa([1, 2], "double"), isa([1, 2], "double"))
test_result_class(12,1) = isequal(isa("abc", "char"), isa("abc", "char"))
test_result_class(13,1) = isequal(isa('abc', "char"), isa('abc', "char"))
test_result_class(14,1) = isequal(isa({1, 2}, "cell"), isa({1, 2}, "cell"))
test_result_class(15,1) = isequal(isa(struct(), "struct"), isa(struct(), "struct"))
test_result_class(16,1) = isequal(isa(@sin, "function_handle"), isa(@sin, "function_handle"))
test_result_class(17,1) = isequal(isa(@(x) x + 1, "function_handle"), isa(@(x) x + 1, "function_handle"))

test_result_class(18,1) = isequal(isa(1, "char"), isa(1, "char"))
test_result_class(19,1) = isequal(isa("abc", "double"), isa("abc", "double"))
test_result_class(20,1) = isequal(isa({1, 2}, "double"), isa({1, 2}, "double"))
test_result_class(21,1) = isequal(isa(struct(), "cell"), isa(struct(), "cell"))
test_result_class(22,1) = isequal(isa(@sin, "double"), isa(@sin, "double"))

test_result_class(23,1) = isequal(isa(1, "single"), isa(1, "single"))

function h = makeclasshandle()
  function y = inner(x)
    y = x + 1;
  end
  h = @inner;
end

h = makeclasshandle()
test_result_class(24,1) = isequal(class(h), class(h))
test_result_class(25,1) = isequal(isa(h, "function_handle"), isa(h, "function_handle"))

function y = acceptdouble(x)
  arguments
    x double
  end
  y = isa(x, "double");
end

test_result_class(26,1) = isequal(acceptdouble(5), acceptdouble(5))
test_result_class(27,1) = isequal(acceptdouble([1, 2]), acceptdouble([1, 2]))


complete_test_result_class = all(test_result_class)

complete_test_result_class
