clear

function [a, b] = pair(x)
  a = x;
  b = x + 1;
end

test_result_arg_ret(1,1) = isequal(pair(10), pair(10))

[u, v] = pair(10)

function y = countargs(a, b)
  y = nargin;
end

test_result_arg_ret(2,1) = isequal(countargs(3, 4), countargs(3, 4))

function [a, b] = countouts()
  a = nargout;
  b = nargout + 10;
end

x = countouts()

[x, y] = countouts()

function [a, b] = counts(x)
  a = nargin();
  b = nargout();
end

[p, q] = counts(7)

function y = inner()
  y = nargout;
end

function [a, b] = outer()
  a = inner();
  b = nargout;
end

[m, n] = outer()

[u, v, w] = pair(10) % error: saída 3 não existe

function y = firstextra(a, varargin)
  y = a + varargin{1};
end

test_result_arg_ret(3,1) = isequal(firstextra(10, 3, 4), firstextra(10, 3, 4))

function y = addfirsttwo(varargin)
  y = varargin{1} + varargin{2};
end

test_result_arg_ret(4,1) = isequal(addfirsttwo(5, 7), addfirsttwo(5, 7))

function y = countall(a, varargin)
  y = nargin;
end

test_result_arg_ret(5,1) = isequal(countall(1), countall(1))

test_result_arg_ret(6,1) = isequal(countall(1, 2, 3), countall(1, 2, 3))

function y = noextra(a, varargin)
  y = nargin;
end

test_result_arg_ret(7,1) = isequal(noextra(9), noextra(9))

function y = secondextra(a, varargin)
  y = varargin{2};
end

test_result_arg_ret(8,1) = isequal(secondextra(1, 20, 30), secondextra(1, 20, 30))

function [a, b] = varoutcheck(x, varargin)
  a = nargin;
  b = x + varargin{1};
end

[p, q] = varoutcheck(10, 5)

function y = needsfixed(a, b, varargin)
  y = nargin;
end

needsfixed(1) % error: falta o segundo argumento fixo

function varargout = splitvar(x)
  varargout{1} = x;
  varargout{2} = x + 1;
end

a = splitvar(10)

[a, b] = splitvar(10)

function varargout = countvarouts()
  varargout{1} = nargout;
  varargout{2} = nargout + 10;
end

c = countvarouts()

[c, d] = countvarouts()

function varargout = echoextras(varargin)
  varargout{1} = varargin{1};
  varargout{2} = varargin{2};
end

[u, v] = echoextras(3, 4)

function varargout = mixfixed(a, varargin)
  varargout{1} = nargin;
  varargout{2} = a + varargin{1};
end

[p, q] = mixfixed(10, 5)

function varargout = oneout(x)
  varargout{1} = x;
end

[z1, z2] = oneout(99) % error: saída 2 não foi preenchida

function y = checkedarg(x)
  arguments
    x
  end
  y = x;
end

test_result_arg_ret(9,1) = isequal(checkedarg(5), checkedarg(5))

function y = checkedtwo(x, z)
  arguments
    x
    z
  end
  y = x + z;
end

test_result_arg_ret(10,1) = isequal(checkedtwo(2, 3), checkedtwo(2, 3))

function y = checkedvarargin(x, varargin)
  arguments
    x
    varargin
  end
  y = nargin;
end

test_result_arg_ret(11,1) = isequal(checkedvarargin(1, 2, 3), checkedvarargin(1, 2, 3))

function varargout = checkedvarargout(x)
  arguments
    x
  end
  varargout{1} = x;
  varargout{2} = x + 1;
end

[a1, a2] = checkedvarargout(10)

function y = badarg(x) % error
  arguments
    z
  end
  y = x;
end

function y = checkedsize(x) % error
  arguments
    x (1,1)
  end
  y = x;
end

function y = adddefault(x, z)
  arguments
    x
    z = 10
  end
  y = x + z;
end

test_result_arg_ret(12,1) = isequal(adddefault(5), adddefault(5))

test_result_arg_ret(13,1) = isequal(adddefault(5, 3), adddefault(5, 3))

function y = defaultfromprevious(x, z)
  arguments
    x
    z = x + 1
  end
  y = z;
end

test_result_arg_ret(14,1) = isequal(defaultfromprevious(10), defaultfromprevious(10))

function y = defaultchain(x, z, w)
  arguments
    x
    z = x + 1
    w = z + 1
  end
  y = w;
end

test_result_arg_ret(15,1) = isequal(defaultchain(20), defaultchain(20))

test_result_arg_ret(16,1) = isequal(defaultchain(20, 30), defaultchain(20, 30))

test_result_arg_ret(17,1) = isequal(defaultchain(20, 30, 40), defaultchain(20, 30, 40))

function y = defaultwithvarargin(x, z, varargin)
  arguments
    x
    z = 10
    varargin
  end
  y = x + z + nargin;
end

test_result_arg_ret(18,1) = isequal(defaultwithvarargin(5), defaultwithvarargin(5))

test_result_arg_ret(19,1) = isequal(defaultwithvarargin(5, 3, 9), defaultwithvarargin(5, 3, 9))

function y = needsfirst(x, z)
  arguments
    x
    z = 10
  end
  y = x + z;
end

needsfirst() % error: x continua obrigatório

% A sequence to test return.
clear

function y = early(x)
  y = x;
  return
  y = x + 100;
end

test_result_arg_ret(20,1) = isequal(early(5), early(5))
test_result_arg_ret(21,1) = isequal(early(-3), early(-3))


function y = abszero(x)
  if x < 0
    y = 0;
    return
  end
  y = x;
end

test_result_arg_ret(22,1) = isequal(abszero(-5), abszero(-5))
test_result_arg_ret(23,1) = isequal(abszero(7), abszero(7))


function y = earlycounter(stop)
  persistent c = 0;
  c = c + 1;
  y = c;
  if stop
    return
  end
  y = c + 100;
end

test_result_arg_ret(24,1) = isequal(earlycounter(1), earlycounter(1))
test_result_arg_ret(25,1) = isequal(earlycounter(0), earlycounter(0))
test_result_arg_ret(26,1) = isequal(earlycounter(1), earlycounter(1))


function [a, b] = earlypair()
  a = 1;
  return
  b = 2;
end

a = earlypair()
[a, b] = earlypair()   % erro: b não foi atribuída


function y = returnwithglobal(x)
  global g
  g = x;
  y = g;
  return
  g = 999;
  y = 999;
end

test_result_arg_ret(27,1) = isequal(returnwithglobal(7), returnwithglobal(7))
test_result_arg_ret(28,1) = isequal(g, g)

test_result_arg_ret(29,1) = true


clear

function [a, b] = fixedarity(x, y)
  a = x;
  b = y;
end

test_result_arg_ret(30,1) = isequal(nargin(@fixedarity), nargin(@fixedarity))
test_result_arg_ret(31,1) = isequal(nargout(@fixedarity), nargout(@fixedarity))

test_result_arg_ret(32,1) = isequal(nargin("fixedarity"), nargin("fixedarity"))
test_result_arg_ret(33,1) = isequal(nargout("fixedarity"), nargout("fixedarity"))

function y = varinarity(x, varargin)
  y = nargin;
end

test_result_arg_ret(34,1) = isequal(nargin(@varinarity), nargin(@varinarity))

test_result_arg_ret(35,1) = isequal(varinarity(1), varinarity(1))
test_result_arg_ret(36,1) = isequal(varinarity(1, 2, 3), varinarity(1, 2, 3))

function varargout = varoutarity(x)
  varargout{1} = x;
  varargout{2} = x + 1;
end

test_result_arg_ret(37,1) = isequal(nargout(@varoutarity), nargout(@varoutarity))

a = varoutarity(10)
[a, b] = varoutarity(10)

test_result_arg_ret(38,1) = isequal(nargin(@(x, y) x + y), nargin(@(x, y) x + y))
test_result_arg_ret(39,1) = isequal(nargout(@(x, y) x + y), nargout(@(x, y) x + y))

test_result_arg_ret(40,1) = isequal(nargin("@(x, y, z) x + y + z"), nargin("@(x, y, z) x + y + z"))
test_result_arg_ret(41,1) = isequal(nargout("@(x, y, z) x + y + z"), nargout("@(x, y, z) x + y + z"))

function h = makenestedarity(a)
  function [u, v] = inner(x, y)
    u = x + a;
    v = y + a;
  end
  h = @inner;
end

h = makenestedarity(10)
test_result_arg_ret(42,1) = isequal(nargin(h), nargin(h))
test_result_arg_ret(43,1) = isequal(nargout(h), nargout(h))

[u, v] = h(1, 2)

function y = currentnargin(a, b, varargin)
  y = nargin;
end

test_result_arg_ret(44,1) = isequal(currentnargin(1, 2), currentnargin(1, 2))
test_result_arg_ret(45,1) = isequal(currentnargin(1, 2, 3, 4), currentnargin(1, 2, 3, 4))

function [a, b] = currentnargout(x)
  a = nargout;
  b = nargout + x;
end

z = currentnargout(10)
[z, w] = currentnargout(10)


clear

function y = checkedinputs(a, varargin)
  narginchk(1, 3)
  y = nargin;
end

test_result_arg_ret(46,1) = isequal(checkedinputs(10), checkedinputs(10))
test_result_arg_ret(47,1) = isequal(checkedinputs(10, 20), checkedinputs(10, 20))
test_result_arg_ret(48,1) = isequal(checkedinputs(10, 20, 30), checkedinputs(10, 20, 30))
checkedinputs()            % erro: poucos argumentos
checkedinputs(1, 2, 3, 4)  % erro: muitos argumentos

function y = checkedinputsinf(a, varargin)
  narginchk(1, Inf)
  y = nargin;
end

test_result_arg_ret(49,1) = isequal(checkedinputsinf(1), checkedinputsinf(1))
test_result_arg_ret(50,1) = isequal(checkedinputsinf(1, 2, 3, 4, 5), checkedinputsinf(1, 2, 3, 4, 5))

function [a, b] = checkedoutputs(x)
  nargoutchk(1, 2)
  a = nargout;
  b = x + 1;
end

a = checkedoutputs(10)       % OK: a = 1
[a, b] = checkedoutputs(10)  % OK: a = 2, b = 11
test_result_arg_ret(51,1) = isequal(checkedoutputs(10), checkedoutputs(10))

function varargout = checkedvaroutputs(x)
  nargoutchk(1, 2)
  varargout{1} = nargout;
  varargout{2} = x + 1;
  varargout{3} = x + 2;
end

a = checkedvaroutputs(10)          % OK: a = 1
[a, b] = checkedvaroutputs(10)     % OK: a = 2, b = 11
[a, b, c] = checkedvaroutputs(10)  % erro: muitas saídas

function y = exactinputs(a, b)
  narginchk(2, 2)
  y = a + b;
end

test_result_arg_ret(52,1) = isequal(exactinputs(3, 4), exactinputs(3, 4))
exactinputs(3)     % erro: poucos argumentos
exactinputs(3,4,5) % erro: muitos argumentos

function y = invalidbounds(x)
  narginchk(3, 1)
  y = x;
end

invalidbounds(1)   % erro: limite máximo menor que mínimo

clear

function [a, b] = arityfixed(x, y)
  a = x;
  b = y;
end

test_result_arg_ret(53,1) = isequal(nargin(@arityfixed), nargin(@arityfixed))
test_result_arg_ret(54,1) = isequal(nargout(@arityfixed), nargout(@arityfixed))
test_result_arg_ret(55,1) = isequal(nargin("arityfixed"), nargin("arityfixed"))
test_result_arg_ret(56,1) = isequal(nargout("arityfixed"), nargout("arityfixed"))

function y = arityvarin(x, varargin)
  y = nargin;
end

test_result_arg_ret(57,1) = isequal(nargin(@arityvarin), nargin(@arityvarin))
test_result_arg_ret(58,1) = isequal(nargin("arityvarin"), nargin("arityvarin"))
test_result_arg_ret(59,1) = isequal(arityvarin(1), arityvarin(1))
test_result_arg_ret(60,1) = isequal(arityvarin(1, 2, 3), arityvarin(1, 2, 3))

function varargout = arityvarout(x)
  varargout{1} = x;
  varargout{2} = x + 1;
end

test_result_arg_ret(61,1) = isequal(nargout(@arityvarout), nargout(@arityvarout))
test_result_arg_ret(62,1) = isequal(nargout("arityvarout"), nargout("arityvarout"))
a = arityvarout(10)
[a, b] = arityvarout(10)

function [a, varargout] = aritymixedout(x, varargin)
  a = x;
  varargout{1} = nargin;
  varargout{2} = x + 2;
end

test_result_arg_ret(63,1) = isequal(nargin(@aritymixedout), nargin(@aritymixedout))
test_result_arg_ret(64,1) = isequal(nargout(@aritymixedout), nargout(@aritymixedout))
test_result_arg_ret(65,1) = isequal(nargin("aritymixedout"), nargin("aritymixedout"))
test_result_arg_ret(66,1) = isequal(nargout("aritymixedout"), nargout("aritymixedout"))
a = aritymixedout(5)
[a, b] = aritymixedout(5, 6, 7)
[a, b, c] = aritymixedout(5, 6, 7)

test_result_arg_ret(67,1) = isequal(nargin(@(x, y) x + y), nargin(@(x, y) x + y))
test_result_arg_ret(68,1) = isequal(nargout(@(x, y) x + y), nargout(@(x, y) x + y))
test_result_arg_ret(69,1) = isequal(nargin("@(x, y, z) x + y + z"), nargin("@(x, y, z) x + y + z"))
test_result_arg_ret(70,1) = isequal(nargout("@(x, y, z) x + y + z"), nargout("@(x, y, z) x + y + z"))

function h = makearityhandle(offset)
  function [u, v] = inner(x, y)
    u = x + offset;
    v = y + offset;
  end
  h = @inner;
end

h = makearityhandle(10)
test_result_arg_ret(71,1) = isequal(nargin(h), nargin(h))
test_result_arg_ret(72,1) = isequal(nargout(h), nargout(h))

nargin(3)              % erro esperado
nargout("missingfunc") % erro esperado


clear

function [a, varargout] = mixedoutvalues(x, varargin)
  a = x;
  varargout{1} = nargin;
  varargout{2} = x + 2;
end

a = mixedoutvalues(5)
[a, b] = mixedoutvalues(5, 6, 7)
[a, b, c] = mixedoutvalues(5, 6, 7)

test_result_arg_ret(73,1) = isequal(nargin(@mixedoutvalues), nargin(@mixedoutvalues))
test_result_arg_ret(74,1) = isequal(nargout(@mixedoutvalues), nargout(@mixedoutvalues))
test_result_arg_ret(75,1) = isequal(nargin("mixedoutvalues"), nargin("mixedoutvalues"))
test_result_arg_ret(76,1) = isequal(nargout("mixedoutvalues"), nargout("mixedoutvalues"))

function [a, b, varargout] = twomixedoutvalues(x)
  a = x;
  b = x + 1;
  varargout{1} = x + 2;
  varargout{2} = x + 3;
end

a = twomixedoutvalues(10)
[a, b] = twomixedoutvalues(10)
[a, b, c] = twomixedoutvalues(10)
[a, b, c, d] = twomixedoutvalues(10)

test_result_arg_ret(77,1) = isequal(nargout(@twomixedoutvalues), nargout(@twomixedoutvalues))
test_result_arg_ret(78,1) = isequal(nargout("twomixedoutvalues"), nargout("twomixedoutvalues"))

function [a, varargout] = missingmixedout(x)
  a = x;
  varargout{1} = x + 1;
end

[a, b] = missingmixedout(4)
[a, b, c] = missingmixedout(4)   % erro esperado: terceiro retorno indefinido

function [a, varargout] = countmixedout(varargin)
  a = nargin;
  varargout{1} = nargin + 10;
  varargout{2} = nargin + 20;
end

a = countmixedout()
[a, b] = countmixedout(1, 2)
[a, b, c] = countmixedout(1, 2, 3)
test_result_arg_ret(79,1) = isequal(nargin(@countmixedout), nargin(@countmixedout))
test_result_arg_ret(80,1) = isequal(nargout(@countmixedout), nargout(@countmixedout))

clear

f = @(x, y) nargin
test_result_arg_ret(81,1) = isequal(f(1, 2), f(1, 2))

f = @(x, y) nargin()
test_result_arg_ret(82,1) = isequal(f(10, 20), f(10, 20))

g = @(x) nargout
a = g(10)

g = @(x) nargout()
a = g(20)

h = @(x, y, z) nargin + nargout
test_result_arg_ret(83,1) = isequal(h(1, 2, 3), h(1, 2, 3))

function f = makeanonmeta(offset)
  f = @(x, y) nargin + nargout + offset;
end

m = makeanonmeta(10)
test_result_arg_ret(84,1) = isequal(m(1, 2), m(1, 2))

function f = makeanonwithclosure(a)
  b = 5;
  f = @(x, y) x + y + a + b + nargin + nargout;
end

q = makeanonwithclosure(100)
test_result_arg_ret(85,1) = isequal(q(1, 2), q(1, 2))

function y = callanoninside(f)
  y = f(3, 4);
end

f = @(x, y) x + y + nargin + nargout
test_result_arg_ret(86,1) = isequal(callanoninside(f), callanoninside(f))

test_result_arg_ret(87,1) = isequal(nargin(@(x, y) nargin), nargin(@(x, y) nargin))
test_result_arg_ret(88,1) = isequal(nargout(@(x) nargout), nargout(@(x) nargout))

f = @(x) nargin
f()          % erro esperado: número inválido de argumentos

f = @(x) nargout
[a, b] = f(1) % erro esperado: número inválido de saídas

clear

f = @(x) inputname(1)
source = 10
test_result_arg_ret(89,1) = isequal(f(source), f(source))
test_result_arg_ret(90,1) = isequal(f(10), f(10))

g = @(x, y, z) [inputname(1), inputname(2), inputname(3)]
a = 1
b = 2
test_result_arg_ret(91,1) = isequal(g(a, b, a + b), g(a, b, a + b))

h = @(x, y) inputname(2)
test_result_arg_ret(92,1) = isequal(h(a, b), h(a, b))
test_result_arg_ret(93,1) = isequal(h(a, 20), h(a, 20))

function f = makeinputnameanon()
  f = @(x) inputname(1);
end

m = makeinputnameanon()
value = 42
test_result_arg_ret(94,1) = isequal(m(value), m(value))
test_result_arg_ret(95,1) = isequal(m(42), m(42))

function f = makeinputnameclosure(offset)
  f = @(x) [inputname(1), inputname(2)];
end

q = makeinputnameclosure(10)
first = 1
second = 2
q(first, second)       % erro esperado: lambda espera 1 argumento

function f = makeinputnameclosure2(offset)
  f = @(x, y) [inputname(1), inputname(2)];
end

q = makeinputnameclosure2(10)
test_result_arg_ret(96,1) = isequal(q(first, second), q(first, second))
test_result_arg_ret(97,1) = isequal(q(first, second + 1), q(first, second + 1))

inputname(1)           % erro esperado: fora de função/lambda

f = @(x) inputname(0)
f(a)                   % erro esperado: índice inválido

f = @(x) inputname(1.5)
f(a)                   % erro esperado: índice inválido


complete_test_result_arg_ret = all(test_result_arg_ret)

complete_test_result_arg_ret
