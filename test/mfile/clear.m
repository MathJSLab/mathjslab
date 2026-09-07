clear

function y = clearuser()
  y = 10;
end

test_result_clear(1,1) = isequal(clearuser(), clearuser())
test_result_clear(2,1) = isequal(exist("clearuser"), exist("clearuser"))
test_result_clear(3,1) = isequal(which("clearuser"), which("clearuser"))

clear clearuser

test_result_clear(4,1) = isequal(exist("clearuser"), exist("clearuser"))
test_result_clear(5,1) = isequal(which("clearuser"), which("clearuser"))
clearuser()  % erro: funcao indefinida

function y = clearone()
  y = 1;
end

function y = cleartwo()
  y = 2;
end

test_result_clear(6,1) = isequal(clearone(), clearone())
test_result_clear(7,1) = isequal(cleartwo(), cleartwo())
test_result_clear(8,1) = isequal(exist("clearone"), exist("clearone"))
test_result_clear(9,1) = isequal(exist("cleartwo"), exist("cleartwo"))
test_result_clear(10,1) = isequal(exist("sin"), exist("sin"))

clear functions

test_result_clear(11,1) = isequal(exist("clearone"), exist("clearone"))
test_result_clear(12,1) = isequal(exist("cleartwo"), exist("cleartwo"))
test_result_clear(13,1) = isequal(exist("sin"), exist("sin"))
test_result_clear(14,1) = isequal(which("sin"), which("sin"))

function y = clearshadow()
  y = 5;
end

clearshadow = 3
test_result_clear(15,1) = isequal(clearshadow, clearshadow)

clear clearshadow

test_result_clear(16,1) = isequal(exist("clearshadow"), exist("clearshadow"))
test_result_clear(17,1) = isequal(clearshadow(), clearshadow())

function y = clearcounter()
  persistent c = 0;
  c = c + 1;
  y = c;
end

test_result_clear(18,1) = isequal(clearcounter(), clearcounter())
test_result_clear(19,1) = isequal(clearcounter(), clearcounter())

clear clearcounter

function y = clearcounter()
  persistent c = 0;
  c = c + 1;
  y = c;
end

test_result_clear(20,1) = isequal(clearcounter(), clearcounter())

function y = clearcounter2()
  persistent c = 0;
  c = c + 1;
  y = c;
end

test_result_clear(21,1) = isequal(clearcounter2(), clearcounter2())
test_result_clear(22,1) = isequal(clearcounter2(), clearcounter2())

clear functions

test_result_clear(23,1) = isequal(exist("clearcounter2"), exist("clearcounter2"))
clearcounter2()  % erro: funcao indefinida

function y = afterclear()
  y = 99;
end

test_result_clear(24,1) = isequal(afterclear(), afterclear())

clear

test_result_clear(25,1) = isequal(exist("afterclear"), exist("afterclear"))
test_result_clear(26,1) = isequal(exist("sin"), exist("sin"))


clear

global g h
test_result_clear(27,1) = true
g = 10
h = 20
test_result_clear(28,1) = isequal(exist("g", "var"), exist("g", "var"))
test_result_clear(29,1) = isequal(exist("h", "var"), exist("h", "var"))

clear global
test_result_clear(30,1) = isequal(exist("g", "var"), exist("g", "var"))
test_result_clear(31,1) = isequal(exist("h", "var"), exist("h", "var"))

localValue = 30
global g
test_result_clear(32,1) = true
g = 5
clear global
test_result_clear(33,1) = isequal(localValue, localValue)
test_result_clear(34,1) = isequal(exist("g", "var"), exist("g", "var"))

global g
test_result_clear(35,1) = true
g = 3
test_result_clear(36,1) = isequal(g, g)

function y = readclearedglobal()
  global g
  y = exist("g", "var");
end

test_result_clear(37,1) = isequal(readclearedglobal(), readclearedglobal())

test_result_clear(38,1) = isequal(global g, global g)
g = 11
test_result_clear(39,1) = isequal(readclearedglobal(), readclearedglobal())

clear global
test_result_clear(40,1) = isequal(readclearedglobal(), readclearedglobal())

function y = clearandreadglobal()
  global g
  g = 99;
  clear global
  y = exist("g", "var");
end

test_result_clear(41,1) = isequal(clearandreadglobal(), clearandreadglobal())
test_result_clear(42,1) = isequal(exist("g", "var"), exist("g", "var"))

test_result_clear(43,1) = isequal(global a b c, global a b c)
a = 1
b = 2
c = 3
clear global
test_result_clear(44,1) = isequal(exist("a", "var"), exist("a", "var"))
test_result_clear(45,1) = isequal(exist("b", "var"), exist("b", "var"))
test_result_clear(46,1) = isequal(exist("c", "var"), exist("c", "var"))

test_result_clear(47,1) = isequal(global a, global a)
a = 42
test_result_clear(48,1) = isequal(a, a)


complete_test_result_clear = all(test_result_clear)

complete_test_result_clear
