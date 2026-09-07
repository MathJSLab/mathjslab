clear % clear all variables

clear

test_result_exist(1,1) = isequal(exist("missing_name"), exist("missing_name"))

x = 1
test_result_exist(2,1) = isequal(exist("x"), exist("x"))
test_result_exist(3,1) = isequal(exist("x", "var"), exist("x", "var"))
test_result_exist(4,1) = isequal(exist("x", "builtin"), exist("x", "builtin"))
test_result_exist(5,1) = isequal(exist("x", "file"), exist("x", "file"))

function y = existuser(x)
  y = x;
end

test_result_exist(6,1) = isequal(exist("existuser"), exist("existuser"))
test_result_exist(7,1) = isequal(exist("existuser", "file"), exist("existuser", "file"))
test_result_exist(8,1) = isequal(exist("existuser", "function"), exist("existuser", "function"))
test_result_exist(9,1) = isequal(exist("existuser", "var"), exist("existuser", "var"))
test_result_exist(10,1) = isequal(exist("existuser", "builtin"), exist("existuser", "builtin"))

test_result_exist(11,1) = isequal(exist("sin"), exist("sin"))
test_result_exist(12,1) = isequal(exist("sin", "builtin"), exist("sin", "builtin"))
test_result_exist(13,1) = isequal(exist("sin", "file"), exist("sin", "file"))
test_result_exist(14,1) = isequal(exist("sin", "function"), exist("sin", "function"))
test_result_exist(15,1) = isequal(exist("sin", "var"), exist("sin", "var"))

test_result_exist(16,1) = isequal(exist("double", "class"), exist("double", "class"))
test_result_exist(17,1) = isequal(exist("single", "class"), exist("single", "class"))
test_result_exist(18,1) = isequal(exist("char", "class"), exist("char", "class"))
test_result_exist(19,1) = isequal(exist("cell", "class"), exist("cell", "class"))
test_result_exist(20,1) = isequal(exist("struct", "class"), exist("struct", "class"))
test_result_exist(21,1) = isequal(exist("function_handle", "class"), exist("function_handle", "class"))
test_result_exist(22,1) = isequal(exist("unknown_class", "class"), exist("unknown_class", "class"))

function y = outerexist()
  y = exist("inner");
  function z = inner()
    z = 1;
  end
end

test_result_exist(23,1) = isequal(outerexist(), outerexist())
test_result_exist(24,1) = isequal(exist("inner"), exist("inner"))

function y = outerexistvar()
  a = 10;
  y = exist("a", "var");
end

test_result_exist(25,1) = isequal(outerexistvar(), outerexistvar())
test_result_exist(26,1) = isequal(exist("a", "var"), exist("a", "var"))

global gexist
test_result_exist(27,1) = true
test_result_exist(28,1) = isequal(exist("gexist"), exist("gexist"))
test_result_exist(29,1) = isequal(exist("gexist", "var"), exist("gexist", "var"))

gexist = 5
test_result_exist(30,1) = isequal(exist("gexist"), exist("gexist"))
test_result_exist(31,1) = isequal(exist("gexist", "var"), exist("gexist", "var"))


complete_test_result_exist = all(test_result_exist)

complete_test_result_exist
