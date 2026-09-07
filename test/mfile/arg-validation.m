clear % clear all variables

function y = scalaronly(x)
  arguments
    x (1,1)
  end
  y = x;
end

test_result_arg_validation(1,1) = isequal(scalaronly(5), scalaronly(5))

scalaronly([1,2]) % error: expected size 1x1, got 1x2

function y = rowonly(x)
  arguments
    x (1,2)
  end
  y = x;
end

test_result_arg_validation(2,1) = isequal(rowonly([1,2]), rowonly([1,2]))

rowonly([1;2]) % error: expected size 1x2, got 2x1

function y = columnonly(x)
  arguments
    x (2,1)
  end
  y = x;
end

test_result_arg_validation(3,1) = isequal(columnonly([1;2]), columnonly([1;2]))

columnonly([1,2]) % error: expected size 2x1, got 1x2

function y = defaultscalar(x)
  arguments
    x (1,1) = 4
  end
  y = x;
end

test_result_arg_validation(4,1) = isequal(defaultscalar(), defaultscalar())

test_result_arg_validation(5,1) = isequal(defaultscalar(9), defaultscalar(9))

defaultscalar([1,2]) % error: expected size 1x1, got 1x2

function y = twoargs(x, z)
  arguments
    x (1,1)
    z (1,2) = [10,20]
  end
  y = x + z;
end

test_result_arg_validation(6,1) = isequal(twoargs(5), twoargs(5))

test_result_arg_validation(7,1) = isequal(twoargs(5, [1,2]), twoargs(5, [1,2]))

twoargs([1,2]) % error: x expected size 1x1, got 1x2

twoargs(5, [1;2]) % error: z expected size 1x2, got 2x1

function y = symbolicshape(x)
  arguments
    x (n,1)
  end
  y = x;
end

clear

function y = doubleonly(x)
  arguments
    x double
  end
  y = x;
end

test_result_arg_validation(8,1) = isequal(doubleonly(3), doubleonly(3))

test_result_arg_validation(9,1) = isequal(doubleonly([1,2]), doubleonly([1,2]))

doubleonly('abc') % error: expected class double, got char

function y = charonly(x)
  arguments
    x char
  end
  y = x;
end

test_result_arg_validation(10,1) = isequal(charonly('abc'), charonly('abc'))

charonly(3) % error: expected class char, got double

function y = cellonly(x)
  arguments
    x cell
  end
  y = x;
end

test_result_arg_validation(11,1) = isequal(cellonly({1,2}), cellonly({1,2}))

cellonly([1,2]) % error: expected class cell, got double

function y = structonly(x)
  arguments
    x struct
  end
  y = x;
end

test_result_arg_validation(12,1) = isequal(structonly(struct()), structonly(struct()))

structonly(3) % error: expected class struct, got double

function y = handleonly(f)
  arguments
    f function_handle
  end
  y = f(3);
end

test_result_arg_validation(13,1) = isequal(handleonly(@(x) x + 1), handleonly(@(x) x + 1))

handleonly(3) % error: expected class function_handle, got double

function y = typedrow(x)
  arguments
    x (1,2) double
  end
  y = x;
end

test_result_arg_validation(14,1) = isequal(typedrow([1,2]), typedrow([1,2]))

typedrow([1;2]) % error: expected size 1x2, got 2x1

typedrow({1,2}) % error: expected class double, got cell

function y = class(x)
  arguments
    x single
  end
  y = x;
end

clear

function y = numericonly(x)
  arguments
    x {mustBeNumeric}
  end
  y = x;
end

test_result_arg_validation(15,1) = isequal(numericonly(3), numericonly(3))

test_result_arg_validation(16,1) = isequal(numericonly([1,2]), numericonly([1,2]))

numericonly('abc') % error: mustBeNumeric

function y = textonly(x)
  arguments
    x {mustBeText}
  end
  y = x;
end

test_result_arg_validation(17,1) = isequal(textonly('abc'), textonly('abc'))

textonly(3) % error: mustBeText

function y = scalarvalidated(x)
  arguments
    x {mustBeScalar}
  end
  y = x;
end

test_result_arg_validation(18,1) = isequal(scalarvalidated(3), scalarvalidated(3))

scalarvalidated([1,2]) % error: mustBeScalar

function y = vectorvalidated(x)
  arguments
    x {mustBeVector}
  end
  y = x;
end

test_result_arg_validation(19,1) = isequal(vectorvalidated([1,2]), vectorvalidated([1,2]))

test_result_arg_validation(20,1) = isequal(vectorvalidated([1;2]), vectorvalidated([1;2]))

vectorvalidated([1,2;3,4]) % error: mustBeVector

function y = scalarorempty(x)
  arguments
    x {mustBeScalarOrEmpty}
  end
  y = x;
end

test_result_arg_validation(21,1) = isequal(scalarorempty(3), scalarorempty(3))

test_result_arg_validation(22,1) = isequal(scalarorempty([]), scalarorempty([]))

scalarorempty([1,2]) % error: mustBeScalarOrEmpty

function y = nonemptyvalidated(x)
  arguments
    x {mustBeNonempty}
  end
  y = x;
end

test_result_arg_validation(23,1) = isequal(nonemptyvalidated(3), nonemptyvalidated(3))

test_result_arg_validation(24,1) = isequal(nonemptyvalidated([1,2]), nonemptyvalidated([1,2]))

nonemptyvalidated([]) % error: mustBeNonempty

function y = positiveinteger(x)
  arguments
    x double {mustBePositive, mustBeInteger}
  end
  y = x;
end

test_result_arg_validation(25,1) = isequal(positiveinteger(2), positiveinteger(2))

positiveinteger(-1) % error: mustBePositive

positiveinteger(2.5) % error: mustBeInteger

positiveinteger(1+2i) % error: mustBePositive

function y = nonnegativevalidated(x)
  arguments
    x double {mustBeNonnegative}
  end
  y = x;
end

test_result_arg_validation(26,1) = isequal(nonnegativevalidated(0), nonnegativevalidated(0))

test_result_arg_validation(27,1) = isequal(nonnegativevalidated(3), nonnegativevalidated(3))

nonnegativevalidated(-1) % error: mustBeNonnegative

function y = finitevalidated(x)
  arguments
    x double {mustBeFinite}
  end
  y = x;
end

test_result_arg_validation(28,1) = isequal(finitevalidated(3), finitevalidated(3))

finitevalidated(1/0) % error: mustBeFinite

function y = realonly(x)
  arguments
    x double {mustBeReal}
  end
  y = x;
end

test_result_arg_validation(29,1) = isequal(realonly(3), realonly(3))

realonly(1+2i) % error: mustBeReal

function y = combinedvalidation(x)
  arguments
    x (1,2) double {mustBePositive, mustBeInteger}
  end
  y = x;
end

test_result_arg_validation(30,1) = isequal(combinedvalidation([1,2]), combinedvalidation([1,2]))

combinedvalidation([1;2]) % error: expected size 1x2, got 2x1

combinedvalidation({1,2}) % error: expected class double, got cell

combinedvalidation([1,2.5]) % error: mustBeInteger

combinedvalidation([1,-2]) % error: mustBePositive

function y = validator(x)
  arguments
    x {mustBeOdd}
  end
  y = x;
end

clear

function y = unitinterval(x)
  arguments
    x double {mustBeGreaterThanOrEqual(x, 0), mustBeLessThanOrEqual(x, 1)}
  end
  y = x;
end

test_result_arg_validation(31,1) = isequal(unitinterval(0), unitinterval(0))

test_result_arg_validation(32,1) = isequal(unitinterval(0.5), unitinterval(0.5))

test_result_arg_validation(33,1) = isequal(unitinterval(1), unitinterval(1))

test_result_arg_validation(34,1) = isequal(unitinterval([0,0.5,1]), unitinterval([0,0.5,1]))

unitinterval(-0.1) % error: mustBeGreaterThanOrEqual

unitinterval(1.1) % error: mustBeLessThanOrEqual

function y = strictpositivebelowten(x)
  arguments
    x double {mustBeGreaterThan(x, 0), mustBeLessThan(x, 10)}
  end
  y = x;
end

test_result_arg_validation(35,1) = isequal(strictpositivebelowten(5), strictpositivebelowten(5))

test_result_arg_validation(36,1) = isequal(strictpositivebelowten([1,5,9]), strictpositivebelowten([1,5,9]))

strictpositivebelowten(0) % error: mustBeGreaterThan

strictpositivebelowten(10) % error: mustBeLessThan

function y = greaterthanbase(base, x)
  arguments
    base double
    x double {mustBeGreaterThan(x, base)}
  end
  y = x;
end

test_result_arg_validation(37,1) = isequal(greaterthanbase(3, 4), greaterthanbase(3, 4))

test_result_arg_validation(38,1) = isequal(greaterthanbase(3, [4,5,6]), greaterthanbase(3, [4,5,6]))

greaterthanbase(3, 3) % error: mustBeGreaterThan

greaterthanbase(3, [4,3,5]) % error: mustBeGreaterThan

function y = boundedbyparams(lo, hi, x)
  arguments
    lo double
    hi double
    x double {mustBeGreaterThanOrEqual(x, lo), mustBeLessThanOrEqual(x, hi)}
  end
  y = x;
end

test_result_arg_validation(39,1) = isequal(boundedbyparams(10, 20, 15), boundedbyparams(10, 20, 15))

test_result_arg_validation(40,1) = isequal(boundedbyparams(10, 20, [10,15,20]), boundedbyparams(10, 20, [10,15,20]))

boundedbyparams(10, 20, 9) % error: mustBeGreaterThanOrEqual

boundedbyparams(10, 20, 21) % error: mustBeLessThanOrEqual

function y = comparisonform(x)
  arguments
    x {mustBeGreaterThan(0, x)}
  end
  y = x;
end


clear

function y = ranged(x)
  arguments
    x double {mustBeInRange(x, 0, 1)}
  end
  y = x;
end

test_result_arg_validation(41,1) = isequal(ranged(0), ranged(0))

test_result_arg_validation(42,1) = isequal(ranged(0.5), ranged(0.5))

test_result_arg_validation(43,1) = isequal(ranged(1), ranged(1))

test_result_arg_validation(44,1) = isequal(ranged([0,0.5,1]), ranged([0,0.5,1]))

ranged(-0.1) % error: mustBeInRange

ranged(1.1) % error: mustBeInRange

function y = rangedbyparams(lo, hi, x)
  arguments
    lo double
    hi double
    x double {mustBeInRange(x, lo, hi)}
  end
  y = x;
end

test_result_arg_validation(45,1) = isequal(rangedbyparams(10, 20, 10), rangedbyparams(10, 20, 10))

test_result_arg_validation(46,1) = isequal(rangedbyparams(10, 20, 15), rangedbyparams(10, 20, 15))

test_result_arg_validation(47,1) = isequal(rangedbyparams(10, 20, 20), rangedbyparams(10, 20, 20))

test_result_arg_validation(48,1) = isequal(rangedbyparams(10, 20, [10,15,20]), rangedbyparams(10, 20, [10,15,20]))

rangedbyparams(10, 20, 9) % error: mustBeInRange

rangedbyparams(10, 20, 21) % error: mustBeInRange

function y = combinedrange(x)
  arguments
    x (1,3) double {mustBeInteger, mustBeInRange(x, 1, 5)}
  end
  y = x;
end

test_result_arg_validation(49,1) = isequal(combinedrange([1,3,5]), combinedrange([1,3,5]))

combinedrange([1;3;5]) % error: expected size 1x3, got 3x1

combinedrange([1,3,5.5]) % error: mustBeInteger

combinedrange([1,3,6]) % error: mustBeInRange

function y = rangeform(x)
  arguments
    x {mustBeInRange(0, x, 1)}
  end
  y = x;
end

function y = rangeoption(x)
  arguments
    x {mustBeInRange(x, 0, 1, 'exclude-upper')}
  end
  y = x;
end

clear

function y = choose(x)
  arguments
    x double {mustBeMember(x, [1,2,3])}
  end
  y = x;
end

test_result_arg_validation(50,1) = isequal(choose(1), choose(1))

test_result_arg_validation(51,1) = isequal(choose(2), choose(2))

test_result_arg_validation(52,1) = isequal(choose(3), choose(3))

test_result_arg_validation(53,1) = isequal(choose([1,3]), choose([1,3]))

choose(4) % error: mustBeMember

choose([1,4]) % error: mustBeMember

function y = choosefrom(allowed, x)
  arguments
    allowed double
    x double {mustBeMember(x, allowed)}
  end
  y = x;
end

test_result_arg_validation(54,1) = isequal(choosefrom([10,20], 10), choosefrom([10,20], 10))

test_result_arg_validation(55,1) = isequal(choosefrom([10,20], 20), choosefrom([10,20], 20))

test_result_arg_validation(56,1) = isequal(choosefrom([10,20], [10,20]), choosefrom([10,20], [10,20]))

choosefrom([10,20], 30) % error: mustBeMember

choosefrom([10,20], [10,30]) % error: mustBeMember

function y = combinedmember(x)
  arguments
    x (1,3) double {mustBeInteger, mustBeMember(x, [1,2,3,5,8])}
  end
  y = x;
end

test_result_arg_validation(57,1) = isequal(combinedmember([1,3,8]), combinedmember([1,3,8]))

combinedmember([1;3;8]) % error: expected size 1x3, got 3x1

combinedmember([1,3.5,8]) % error: mustBeInteger

combinedmember([1,4,8]) % error: mustBeMember

function y = memberform(x)
  arguments
    x {mustBeMember([1,2,3], x)}
  end
  y = x;
end


function y = textmember(x)
  arguments
    x char {mustBeMember(x, {'a','b'})}
  end
  y = x;
end

textmember('a') % error: mustBeMember

clear

function [a, b] = checkedpair(x)
  arguments (Output)
    a (1,1) double {mustBePositive}
    b (1,2) double
  end
  a = x;
  b = [x, 3];
end

[a, b] = checkedpair(2)

checkedpair(-1) % erro: a falha em mustBePositive


function [a, b] = skippedoutput(x)
  arguments (Output)
    a double
    b double {mustBePositive}
  end
  a = x;
  b = -1;
end

a = skippedoutput(2)      % OK: somente a foi solicitada
[a, b] = skippedoutput(2) % erro: b foi solicitada e falha em mustBePositive


function [a, b] = missingsecond()
  arguments (Output)
    a double
    b double
  end
  a = 1;
end

a = missingsecond()       % OK: somente a foi solicitada
[a, b] = missingsecond()  % erro: b solicitada mas não atribuída


clear

function [a, b, c] = threeouts(x)
  arguments (Output)
    a (1,1) double
    b (1,2) double
    c (2,1) double
  end
  a = x;
  b = [x, (x + 1)];
  c = [x; (x + 2)];
end

a = threeouts(5)
[a, b] = threeouts(5)
[a, b, c] = threeouts(5)


function [a, b] = badsecondsize(x)
  arguments (Output)
    a double
    b (1,2) double
  end
  a = x;
  b = [x; (x + 1)];
end

a = badsecondsize(4)        % OK: b não foi validada, mas foi calculada sem erro
[a, b] = badsecondsize(4)   % erro esperado: b deveria ser 1x2

clear

function y = countpositive(x, varargin)
  arguments
    x double
  end
  arguments (Repeating)
    value double {mustBePositive}
  end
  y = nargin;
end

test_result_arg_validation(58,1) = isequal(countpositive(1), countpositive(1))
test_result_arg_validation(59,1) = isequal(countpositive(1, 2), countpositive(1, 2))
test_result_arg_validation(60,1) = isequal(countpositive(1, 2, 3), countpositive(1, 2, 3))

countpositive(1, -2)       % erro: value{1} falha em mustBePositive
countpositive(1, 2, -3)    % erro: value{2} falha em mustBePositive
countpositive(1, 'abc')    % erro: value{1} deveria ser double


function y = countrows(varargin)
  arguments (Repeating)
    row (1,2) double
  end
  y = nargin;
end

test_result_arg_validation(61,1) = isequal(countrows(), countrows())
test_result_arg_validation(62,1) = isequal(countrows([1,2]), countrows([1,2]))
test_result_arg_validation(63,1) = isequal(countrows([1,2], [3,4]), countrows([1,2], [3,4]))

countrows([1;2])           % erro: row{1} deveria ser 1x2
countrows([1,2], [3;4])    % erro: row{2} deveria ser 1x2


function y = repeatintegers(varargin)
  arguments (Repeating)
    item double {mustBeInteger, mustBePositive}
  end
  y = nargin;
end

test_result_arg_validation(64,1) = isequal(repeatintegers(1, 2, 3), repeatintegers(1, 2, 3))
test_result_arg_validation(65,1) = isequal(repeatintegers(), repeatintegers())
repeatintegers(1, 2.5)     % erro: item{2} falha em mustBeInteger
repeatintegers(1, -2)      % erro: item{2} falha em mustBePositive


function y = repeatwithoutvarargin(x) % erro esperado na definição: arguments (Repeating) requires a varargin parameter
  arguments (Repeating)
    value double
  end
  y = x;
end


function y = repeatmultiple(varargin) % erro esperado na definição: exatamente uma declaração é suportada por enquanto
  arguments (Repeating)
    a double
    b double
  end
  y = nargin;
end

clear

function y = repeatpairs(varargin)
  arguments (Repeating)
    left double {mustBePositive}
    right double {mustBeInteger}
  end
  y = nargin;
end

test_result_arg_validation(66,1) = isequal(repeatpairs(), repeatpairs())
test_result_arg_validation(67,1) = isequal(repeatpairs(1, 2), repeatpairs(1, 2))
test_result_arg_validation(68,1) = isequal(repeatpairs(1, 2, 3, 4), repeatpairs(1, 2, 3, 4))

repeatpairs(1)             % erro: grupo incompleto
repeatpairs(1, 2, 3)       % erro: grupo incompleto
repeatpairs(-1, 2)         % erro: left{1} falha em mustBePositive
repeatpairs(1, 2, -3, 4)   % erro: left{2} falha em mustBePositive
repeatpairs(1, 2.5)        % erro: right{1} falha em mustBeInteger
repeatpairs(1, 2, 3, 4.5)  % erro: right{2} falha em mustBeInteger


function y = repeatmix(varargin)
  arguments (Repeating)
    name char
    value double {mustBeNonnegative}
  end
  y = nargin;
end

test_result_arg_validation(69,1) = isequal(repeatmix(), repeatmix())
test_result_arg_validation(70,1) = isequal(repeatmix('a', 1), repeatmix('a', 1))
test_result_arg_validation(71,1) = isequal(repeatmix('a', 1, 'b', 2), repeatmix('a', 1, 'b', 2))

repeatmix('a')             % erro: grupo incompleto
repeatmix(1, 2)            % erro: name{1} deveria ser char
repeatmix('a', -1)         % erro: value{1} falha em mustBeNonnegative
repeatmix('a', 1, 'b', -2) % erro: value{2} falha em mustBeNonnegative


function y = repeatrows(varargin)
  arguments (Repeating)
    row (1,2) double
    scale (1,1) double {mustBePositive}
  end
  y = nargin;
end

test_result_arg_validation(72,1) = isequal(repeatrows([1,2], 3), repeatrows([1,2], 3))
test_result_arg_validation(73,1) = isequal(repeatrows([1,2], 3, [4,5], 6), repeatrows([1,2], 3, [4,5], 6))

repeatrows([1;2], 3)       % erro: row{1} deveria ser 1x2
repeatrows([1,2], -3)      % erro: scale{1} falha em mustBePositive
repeatrows([1,2], 3, [4;5], 6) % erro: row{2} deveria ser 1x2

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(74,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(75,1) = isequal(scaleoffset(10, factor=2), scaleoffset(10, factor=2))
test_result_arg_validation(76,1) = isequal(scaleoffset(10, offset=3), scaleoffset(10, offset=3))
test_result_arg_validation(77,1) = isequal(scaleoffset(10, factor=2, offset=3), scaleoffset(10, factor=2, offset=3))

scaleoffset(10, unknown=1)          % erro: nome desconhecido
test_result_arg_validation(78,1) = isequal(scaleoffset(10, factor=2, factor=3), scaleoffset(10, factor=2, factor=3))
scaleoffset(10, factor=2, 3)        % erro: posicional depois de name-value


function y = bounded(x, options)
  arguments
    x double
    options.factor double {mustBePositive} = 1
  end
  y = x * options.factor;
end

test_result_arg_validation(79,1) = isequal(bounded(5), bounded(5))
test_result_arg_validation(80,1) = isequal(bounded(5, factor=3), bounded(5, factor=3))

bounded(5, factor=-1)      % erro: options.factor falha em mustBePositive
bounded(5, factor='abc')   % erro: options.factor deveria ser double


function y = shaped(x, options)
  arguments
    x double
    options.row (1,2) double = [1,2]
    options.scale (1,1) double {mustBePositive} = 1
  end
  y = x * options.scale + options.row(1);
end

test_result_arg_validation(81,1) = isequal(shaped(10), shaped(10))
test_result_arg_validation(82,1) = isequal(shaped(10, scale=2), shaped(10, scale=2))
test_result_arg_validation(83,1) = isequal(shaped(10, row=[3,4]), shaped(10, row=[3,4]))
test_result_arg_validation(84,1) = isequal(shaped(10, row=[3,4], scale=2), shaped(10, row=[3,4], scale=2))

shaped(10, row=[3;4])      % erro: options.row deveria ser 1x2
shaped(10, scale=-2)       % erro: options.scale falha em mustBePositive


function y = textoption(x, options)
  arguments
    x double
    options.mode char = 'add'
  end
  if options.mode == 'add'
    y = x + 1;
  else
    y = x - 1;
  end
end

test_result_arg_validation(85,1) = isequal(textoption(10), textoption(10))
test_result_arg_validation(86,1) = isequal(textoption(10, mode='sub'), textoption(10, mode='sub'))

textoption(10, mode=3)     % erro: options.mode deveria ser char


function y = missingdefault(x, options) % erro esperado na definição: options.factor exige valor default
  arguments
    options.factor double
  end
  y = x;
end

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(87,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(88,1) = isequal(scaleoffset(10, factor=2), scaleoffset(10, factor=2))
test_result_arg_validation(89,1) = isequal(scaleoffset(10, offset=3), scaleoffset(10, offset=3))
test_result_arg_validation(90,1) = isequal(scaleoffset(10, factor=2, offset=3), scaleoffset(10, factor=2, offset=3))

test_result_arg_validation(91,1) = isequal(scaleoffset(10, 'factor', 2), scaleoffset(10, 'factor', 2))
test_result_arg_validation(92,1) = isequal(scaleoffset(10, 'offset', 3), scaleoffset(10, 'offset', 3))
test_result_arg_validation(93,1) = isequal(scaleoffset(10, 'factor', 2, 'offset', 3), scaleoffset(10, 'factor', 2, 'offset', 3))
test_result_arg_validation(94,1) = isequal(scaleoffset(10, 'factor', 2, offset=3), scaleoffset(10, 'factor', 2, offset=3))

scaleoffset(10, 'factor')             % erro: valor faltante
test_result_arg_validation(95,1) = isequal(scaleoffset(10, 'factor', 2, factor=3), scaleoffset(10, 'factor', 2, factor=3))
test_result_arg_validation(96,1) = isequal(scaleoffset(10, factor=2, 'offset', 3), scaleoffset(10, factor=2, 'offset', 3))
scaleoffset(10, 'unknown', 1)         % erro: nome desconhecido


function y = bounded(x, options)
  arguments
    x double
    options.factor double {mustBePositive} = 1
    options.offset double {mustBeNonnegative} = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(97,1) = isequal(bounded(5), bounded(5))
test_result_arg_validation(98,1) = isequal(bounded(5, 'factor', 3), bounded(5, 'factor', 3))
test_result_arg_validation(99,1) = isequal(bounded(5, 'offset', 2), bounded(5, 'offset', 2))
test_result_arg_validation(100,1) = isequal(bounded(5, 'factor', 3, 'offset', 2), bounded(5, 'factor', 3, 'offset', 2))

bounded(5, 'factor', -1)    % erro: options.factor falha em mustBePositive
bounded(5, 'offset', -2)    % erro: options.offset falha em mustBeNonnegative
bounded(5, 'factor', 'abc') % erro: options.factor deveria ser double


function y = shaped(x, options)
  arguments
    x double
    options.row (1,2) double = [1,2]
    options.scale (1,1) double {mustBePositive} = 1
  end
  y = x * options.scale + options.row(1);
end

test_result_arg_validation(101,1) = isequal(shaped(10), shaped(10))
test_result_arg_validation(102,1) = isequal(shaped(10, 'scale', 2), shaped(10, 'scale', 2))
test_result_arg_validation(103,1) = isequal(shaped(10, 'row', [3,4]), shaped(10, 'row', [3,4]))
test_result_arg_validation(104,1) = isequal(shaped(10, 'row', [3,4], 'scale', 2), shaped(10, 'row', [3,4], 'scale', 2))

shaped(10, 'row', [3;4])    % erro: options.row deveria ser 1x2
shaped(10, 'scale', -2)     % erro: options.scale falha em mustBePositive

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(105,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(106,1) = isequal(scaleoffset(10, "factor", 2), scaleoffset(10, "factor", 2))
test_result_arg_validation(107,1) = isequal(scaleoffset(10, "offset", 3), scaleoffset(10, "offset", 3))
test_result_arg_validation(108,1) = isequal(scaleoffset(10, "factor", 2, "offset", 3), scaleoffset(10, "factor", 2, "offset", 3))
test_result_arg_validation(109,1) = isequal(scaleoffset(10, "factor", 2, offset=3), scaleoffset(10, "factor", 2, offset=3))

scaleoffset(10, "factor")             % erro: valor faltante
scaleoffset(10, "unknown", 1)         % erro: nome desconhecido
test_result_arg_validation(110,1) = isequal(scaleoffset(10, "factor", 2, factor=3), scaleoffset(10, "factor", 2, factor=3))
scaleoffset(10, "factor", 2, 3)       % erro: posicional depois de name-value


function y = bounded(x, options)
  arguments
    x double
    options.factor double {mustBePositive} = 1
    options.offset double {mustBeNonnegative} = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(111,1) = isequal(bounded(5), bounded(5))
test_result_arg_validation(112,1) = isequal(bounded(5, "factor", 3), bounded(5, "factor", 3))
test_result_arg_validation(113,1) = isequal(bounded(5, "offset", 2), bounded(5, "offset", 2))
test_result_arg_validation(114,1) = isequal(bounded(5, "factor", 3, "offset", 2), bounded(5, "factor", 3, "offset", 2))

bounded(5, "factor", -1)    % erro: options.factor falha em mustBePositive
bounded(5, "offset", -2)    % erro: options.offset falha em mustBeNonnegative
bounded(5, "factor", "abc") % erro: options.factor deveria ser double


function y = shaped(x, options)
  arguments
    x double
    options.row (1,2) double = [1,2]
    options.scale (1,1) double {mustBePositive} = 1
  end
  y = x * options.scale + options.row(1);
end

test_result_arg_validation(115,1) = isequal(shaped(10), shaped(10))
test_result_arg_validation(116,1) = isequal(shaped(10, "scale", 2), shaped(10, "scale", 2))
test_result_arg_validation(117,1) = isequal(shaped(10, "row", [3,4]), shaped(10, "row", [3,4]))
test_result_arg_validation(118,1) = isequal(shaped(10, "row", [3,4], "scale", 2), shaped(10, "row", [3,4], "scale", 2))

shaped(10, "row", [3;4])    % erro: options.row deveria ser 1x2
shaped(10, "scale", -2)     % erro: options.scale falha em mustBePositive

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(119,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(120,1) = isequal(scaleoffset(10, factor=2), scaleoffset(10, factor=2))
test_result_arg_validation(121,1) = isequal(scaleoffset(10, fac=2), scaleoffset(10, fac=2))
test_result_arg_validation(122,1) = isequal(scaleoffset(10, f=2), scaleoffset(10, f=2))

test_result_arg_validation(123,1) = isequal(scaleoffset(10, offset=3), scaleoffset(10, offset=3))
test_result_arg_validation(124,1) = isequal(scaleoffset(10, off=3), scaleoffset(10, off=3))
test_result_arg_validation(125,1) = isequal(scaleoffset(10, o=3), scaleoffset(10, o=3))

test_result_arg_validation(126,1) = isequal(scaleoffset(10, fac=2, off=3), scaleoffset(10, fac=2, off=3))
test_result_arg_validation(127,1) = isequal(scaleoffset(10, "fac", 2, "off", 3), scaleoffset(10, "fac", 2, "off", 3))
test_result_arg_validation(128,1) = isequal(scaleoffset(10, 'fac', 2, 'off', 3), scaleoffset(10, 'fac', 2, 'off', 3))

test_result_arg_validation(129,1) = isequal(scaleoffset(10, fac=2, factor=3), scaleoffset(10, fac=2, factor=3))
test_result_arg_validation(130,1) = isequal(scaleoffset(10, "off", 3, offset=4), scaleoffset(10, "off", 3, offset=4))
scaleoffset(10, unknown=1)        % erro: nome desconhecido
scaleoffset(10, "unknown", 1)     % erro: nome desconhecido


function y = twofa(x, options)
  arguments
    x double
    options.factor double = 1
    options.fade double = 0
  end
  y = x * options.factor + options.fade;
end

test_result_arg_validation(131,1) = isequal(twofa(10), twofa(10))
test_result_arg_validation(132,1) = isequal(twofa(10, factor=2), twofa(10, factor=2))
test_result_arg_validation(133,1) = isequal(twofa(10, fact=2), twofa(10, fact=2))
test_result_arg_validation(134,1) = isequal(twofa(10, fade=3), twofa(10, fade=3))
test_result_arg_validation(135,1) = isequal(twofa(10, fad=3), twofa(10, fad=3))

twofa(10, fa=2)       % erro: abreviação ambígua entre factor e fade
twofa(10, "fa", 2)    % erro: abreviação ambígua entre factor e fade
twofa(10, 'fa', 2)    % erro: abreviação ambígua entre factor e fade


function y = validateabbr(x, options)
  arguments
    x double
    options.scale double {mustBePositive} = 1
    options.shift double {mustBeNonnegative} = 0
  end
  y = x * options.scale + options.shift;
end

test_result_arg_validation(136,1) = isequal(validateabbr(5), validateabbr(5))
test_result_arg_validation(137,1) = isequal(validateabbr(5, sc=3), validateabbr(5, sc=3))
test_result_arg_validation(138,1) = isequal(validateabbr(5, sh=2), validateabbr(5, sh=2))
test_result_arg_validation(139,1) = isequal(validateabbr(5, sc=3, sh=2), validateabbr(5, sc=3, sh=2))

validateabbr(5, sc=-1)   % erro: options.scale falha em mustBePositive
validateabbr(5, sh=-2)   % erro: options.shift falha em mustBeNonnegative
validateabbr(5, s=2)     % erro: ambíguo entre scale e shift

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(140,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(141,1) = isequal(scaleoffset(10, Factor=2), scaleoffset(10, Factor=2))
test_result_arg_validation(142,1) = isequal(scaleoffset(10, FACTOR=2), scaleoffset(10, FACTOR=2))
test_result_arg_validation(143,1) = isequal(scaleoffset(10, fac=2), scaleoffset(10, fac=2))
test_result_arg_validation(144,1) = isequal(scaleoffset(10, FAC=2), scaleoffset(10, FAC=2))

test_result_arg_validation(145,1) = isequal(scaleoffset(10, Offset=3), scaleoffset(10, Offset=3))
test_result_arg_validation(146,1) = isequal(scaleoffset(10, OFFSET=3), scaleoffset(10, OFFSET=3))
test_result_arg_validation(147,1) = isequal(scaleoffset(10, off=3), scaleoffset(10, off=3))
test_result_arg_validation(148,1) = isequal(scaleoffset(10, OFF=3), scaleoffset(10, OFF=3))

test_result_arg_validation(149,1) = isequal(scaleoffset(10, Factor=2, Offset=3), scaleoffset(10, Factor=2, Offset=3))
test_result_arg_validation(150,1) = isequal(scaleoffset(10, "Factor", 2, "Offset", 3), scaleoffset(10, "Factor", 2, "Offset", 3))
test_result_arg_validation(151,1) = isequal(scaleoffset(10, "FAC", 2, "OFF", 3), scaleoffset(10, "FAC", 2, "OFF", 3))
test_result_arg_validation(152,1) = isequal(scaleoffset(10, 'Fac', 2, 'Off', 3), scaleoffset(10, 'Fac', 2, 'Off', 3))

test_result_arg_validation(153,1) = isequal(scaleoffset(10, Factor=2, factor=3), scaleoffset(10, Factor=2, factor=3))
test_result_arg_validation(154,1) = isequal(scaleoffset(10, fac=2, FACTOR=3), scaleoffset(10, fac=2, FACTOR=3))
test_result_arg_validation(155,1) = isequal(scaleoffset(10, "FAC", 2, factor=3), scaleoffset(10, "FAC", 2, factor=3))


function y = twofa(x, options)
  arguments
    x double
    options.factor double = 1
    options.fade double = 0
  end
  y = x * options.factor + options.fade;
end

test_result_arg_validation(156,1) = isequal(twofa(10), twofa(10))
test_result_arg_validation(157,1) = isequal(twofa(10, Factor=2), twofa(10, Factor=2))
test_result_arg_validation(158,1) = isequal(twofa(10, FACT=2), twofa(10, FACT=2))
test_result_arg_validation(159,1) = isequal(twofa(10, Fade=3), twofa(10, Fade=3))
test_result_arg_validation(160,1) = isequal(twofa(10, FAD=3), twofa(10, FAD=3))

twofa(10, fa=2)      % erro: ambíguo entre factor e fade
twofa(10, FA=2)      % erro: ambíguo entre factor e fade
twofa(10, "FA", 2)   % erro: ambíguo entre factor e fade
twofa(10, 'Fa', 2)   % erro: ambíguo entre factor e fade


function y = validatecase(x, options)
  arguments
    x double
    options.scale double {mustBePositive} = 1
    options.shift double {mustBeNonnegative} = 0
  end
  y = x * options.scale + options.shift;
end

test_result_arg_validation(161,1) = isequal(validatecase(5), validatecase(5))
test_result_arg_validation(162,1) = isequal(validatecase(5, Scale=3), validatecase(5, Scale=3))
test_result_arg_validation(163,1) = isequal(validatecase(5, SHIFT=2), validatecase(5, SHIFT=2))
test_result_arg_validation(164,1) = isequal(validatecase(5, SC=3, SH=2), validatecase(5, SC=3, SH=2))

validatecase(5, SCALE=-1)  % erro: options.scale falha em mustBePositive
validatecase(5, shift=-2)  % erro: options.shift falha em mustBeNonnegative
validatecase(5, S=2)       % erro: ambíguo entre scale e shift

clear

function y = scaleoffset(x, options)
  arguments
    x double
    options.factor double = 1
    options.offset double = 0
  end
  y = x * options.factor + options.offset;
end

test_result_arg_validation(165,1) = isequal(scaleoffset(10), scaleoffset(10))
test_result_arg_validation(166,1) = isequal(scaleoffset(10, Factor=2), scaleoffset(10, Factor=2))
test_result_arg_validation(167,1) = isequal(scaleoffset(10, FACTOR=2), scaleoffset(10, FACTOR=2))
test_result_arg_validation(168,1) = isequal(scaleoffset(10, "OFF", 3), scaleoffset(10, "OFF", 3))
test_result_arg_validation(169,1) = isequal(scaleoffset(10, 'Fac', 2), scaleoffset(10, 'Fac', 2))
test_result_arg_validation(170,1) = isequal(scaleoffset(10, Factor=2, offset=3), scaleoffset(10, Factor=2, offset=3))

test_result_arg_validation(171,1) = isequal(scaleoffset(10, factor=2, factor=3), scaleoffset(10, factor=2, factor=3))
test_result_arg_validation(172,1) = isequal(scaleoffset(10, "Factor", 2, factor=3), scaleoffset(10, "Factor", 2, factor=3))


function y = ambiguous(x, options)
  arguments
    x double
    options.factor double = 1
    options.fade double = 0
  end
  y = x * options.factor + options.fade;
end

test_result_arg_validation(173,1) = isequal(ambiguous(10, fact=2), ambiguous(10, fact=2))
test_result_arg_validation(174,1) = isequal(ambiguous(10, FAD=3), ambiguous(10, FAD=3))

ambiguous(10, fa=2)       % erro: ambíguo
ambiguous(10, "FA", 2)    % erro: ambíguo


function y = validnv(x, options)
  arguments
    x double
    options.scale double {mustBePositive} = 1
    options.shift double {mustBeNonnegative} = 0
  end
  y = x * options.scale + options.shift;
end

test_result_arg_validation(175,1) = isequal(validnv(5), validnv(5))
test_result_arg_validation(176,1) = isequal(validnv(5, Scale=3), validnv(5, Scale=3))
test_result_arg_validation(177,1) = isequal(validnv(5, "SHIFT", 2), validnv(5, "SHIFT", 2))
test_result_arg_validation(178,1) = isequal(validnv(5, sc=3, sh=2), validnv(5, sc=3, sh=2))

validnv(5, SCALE=-1)      % erro: mustBePositive
validnv(5, shift=-2)      % erro: mustBeNonnegative
validnv(5, S=2)           % erro: ambíguo


complete_test_result_arg_validation = all(test_result_arg_validation)

complete_test_result_arg_validation
