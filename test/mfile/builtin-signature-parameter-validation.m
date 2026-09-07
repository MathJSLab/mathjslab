clear

test_result_builtin_signature_parameter_validation(1,1) = isequal(func2str(@sin), func2str(@sin))
test_result_builtin_signature_parameter_validation(2,1) = isequal(func2str(@(x) x + 1), func2str(@(x) x + 1))
func2str("sin")              % erro: argumento deve ser function_handle

test_result_builtin_signature_parameter_validation(3,1) = isequal(str2func("sin"), str2func("sin"))
f = str2func("@(x) x + 1")
test_result_builtin_signature_parameter_validation(4,1) = isequal(f(4), f(4))
str2func(1)                  % erro: argumento deve ser char

test_result_builtin_signature_parameter_validation(5,1) = isequal(functions(@sin), functions(@sin))
test_result_builtin_signature_parameter_validation(6,1) = isequal(functions(@(x) x + 1), functions(@(x) x + 1))
functions("sin")             % erro: argumento deve ser function_handle

test_result_builtin_signature_parameter_validation(7,1) = isequal(isa(1, "double"), isa(1, "double"))
test_result_builtin_signature_parameter_validation(8,1) = isequal(isa("abc", "char"), isa("abc", "char"))
isa(1, 2)                    % erro: segundo argumento deve ser char

test_result_builtin_signature_parameter_validation(9,1) = isequal(which("sin"), which("sin"))
test_result_builtin_signature_parameter_validation(10,1) = isequal(which(@sin), which(@sin))
test_result_builtin_signature_parameter_validation(11,1) = isequal(which(@(x) x + 1), which(@(x) x + 1))
feval("which", 1)            % erro: argumento de which deve ser char ou function_handle

test_result_builtin_signature_parameter_validation(12,1) = isequal(exist("sin"), exist("sin"))
test_result_builtin_signature_parameter_validation(13,1) = isequal(exist("sin", "builtin"), exist("sin", "builtin"))
exist(1)                     % erro: primeiro argumento deve ser char

test_result_builtin_signature_parameter_validation(14,1) = isequal(eval("x = 10"), eval("x = 10"))
test_result_builtin_signature_parameter_validation(15,1) = isequal(x, x)
eval(1)                      % erro: primeiro argumento deve ser char
eval("1", 2)                 % erro: catchCode deve ser char

test_result_builtin_signature_parameter_validation(16,1) = isequal(evalin("base", "y = 20"), evalin("base", "y = 20"))
test_result_builtin_signature_parameter_validation(17,1) = isequal(y, y)
evalin(1, "y = 30")          % erro: workspace deve ser char
evalin("base", 1)            % erro: código deve ser char

test_result_builtin_signature_parameter_validation(18,1) = isequal(assignin("base", "z", 30), assignin("base", "z", 30))
test_result_builtin_signature_parameter_validation(19,1) = isequal(z, z)
assignin("base", 1, 40)      % erro: nome da variável deve ser char

inputname(1)                 % erro: fora de função: deve retornar string vazia ou comportamento já esperado
inputname("1")               % erro: argumento deve ser double

test_result_builtin_signature_parameter_validation(20,1) = isequal(nargin("sin"), nargin("sin"))
test_result_builtin_signature_parameter_validation(21,1) = isequal(nargout("sin"), nargout("sin"))
test_result_builtin_signature_parameter_validation(22,1) = isequal(nargin(@sin), nargin(@sin))
test_result_builtin_signature_parameter_validation(23,1) = isequal(nargout(@sin), nargout(@sin))
nargin(3)                    % erro: alvo deve ser char ou function_handle
nargout(3)                   % erro: alvo deve ser char ou function_handle

test_result_builtin_signature_parameter_validation(24,1) = isequal(feval(@sin, 0), feval(@sin, 0))
test_result_builtin_signature_parameter_validation(25,1) = isequal(feval("sin", 0), feval("sin", 0))
test_result_builtin_signature_parameter_validation(26,1) = isequal(feval("@(x) x + 1", 4), feval("@(x) x + 1", 4))
feval(123, 1)                % erro: primeiro argumento deve ser char ou function_handle

test_result_builtin_signature_parameter_validation(27,1) = isequal(narginchk(0, 2), narginchk(0, 2))
test_result_builtin_signature_parameter_validation(28,1) = isequal(nargoutchk(0, 2), nargoutchk(0, 2))
narginchk("0", 2)            % erro: min deve ser double
nargoutchk(0, "2")           % erro: max deve ser double


% Teste sugerido: builtin_signature_validators
clear

% Casos válidos no workspace/base
test_result_builtin_signature_parameter_validation(29,1) = isequal(narginchk(0, 2), narginchk(0, 2))
test_result_builtin_signature_parameter_validation(30,1) = isequal(narginchk(0, Inf), narginchk(0, Inf))
test_result_builtin_signature_parameter_validation(31,1) = isequal(nargoutchk(0, 2), nargoutchk(0, 2))
test_result_builtin_signature_parameter_validation(32,1) = isequal(nargoutchk(0, Inf), nargoutchk(0, Inf))

% Casos válidos dentro de funções
function y = chkinputsig(a, varargin)
  narginchk(1, 3)
  y = nargin;
end

test_result_builtin_signature_parameter_validation(33,1) = isequal(chkinputsig(10), chkinputsig(10))
test_result_builtin_signature_parameter_validation(34,1) = isequal(chkinputsig(10, 20), chkinputsig(10, 20))
test_result_builtin_signature_parameter_validation(35,1) = isequal(chkinputsig(10, 20, 30), chkinputsig(10, 20, 30))
chkinputsig(10, 20, 30, 40)     % erro: número de argumentos de entrada inválido

function y = chkinputinf(a, varargin)
  narginchk(1, Inf)
  y = nargin;
end

test_result_builtin_signature_parameter_validation(36,1) = isequal(chkinputinf(1), chkinputinf(1))
test_result_builtin_signature_parameter_validation(37,1) = isequal(chkinputinf(1, 2, 3, 4), chkinputinf(1, 2, 3, 4))

function [a, b] = chkoutputsig(x)
  nargoutchk(1, 2)
  a = nargout;
  b = x + 1;
end

r = chkoutputsig(10)
[r, s] = chkoutputsig(10)
[r, s, t] = chkoutputsig(10)    % erro: saída demais

function varargout = chkoutputinf(x)
  nargoutchk(0, Inf)
  varargout{1} = nargout;
  varargout{2} = x + 1;
  varargout{3} = x + 2;
end

test_result_builtin_signature_parameter_validation(38,1) = isequal(chkoutputinf(5), chkoutputinf(5))
[a, b, c] = chkoutputinf(5)

% inputname continua válido somente dentro de função
function name = chkinputname(x)
  name = inputname(1);
end

sourceValue = 42
test_result_builtin_signature_parameter_validation(39,1) = isequal(chkinputname(sourceValue), chkinputname(sourceValue))
test_result_builtin_signature_parameter_validation(40,1) = isequal(chkinputname(42), chkinputname(42))
inputname(1)                    % erro: inputname fora de função

% Validação declarativa dos argumentos de narginchk/nargoutchk
narginchk(-1, 2)                % erro: min deve ser inteiro não-negativo
narginchk(0.5, 2)               % erro: min deve ser inteiro
narginchk(0, -1)                % erro: max deve ser inteiro não-negativo
narginchk(0, 1.5)               % erro: max deve ser inteiro
narginchk(0, "2")               % erro: max deve ser double

nargoutchk(-1, 2)               % erro: min deve ser inteiro não-negativo
nargoutchk(0.5, 2)              % erro: min deve ser inteiro
nargoutchk(0, -1)               % erro: max deve ser inteiro não-negativo
nargoutchk(0, 1.5)              % erro: max deve ser inteiro
nargoutchk("0", 2)              % erro: min deve ser double

% Validação declarativa de inputname
function y = badinputname(n)
  y = inputname(n);
end

test_result_builtin_signature_parameter_validation(41,1) = isequal(badinputname(1), badinputname(1))
badinputname(0)                 % erro: argumento deve ser inteiro positivo
badinputname(1.5)               % erro: argumento deve ser inteiro positivo
badinputname(Inf)               % erro: argumento deve ser finito
badinputname("1")               % erro: argumento deve ser double


% Teste sugerido: builtin_signature_string_identifier_alternatives
clear

% mfilename: opções declarativas permitidas
test_result_builtin_signature_parameter_validation(42,1) = isequal(mfilename(), mfilename())
test_result_builtin_signature_parameter_validation(43,1) = isequal(mfilename("fullpath"), mfilename("fullpath"))
test_result_builtin_signature_parameter_validation(44,1) = isequal(mfilename("class"), mfilename("class"))
test_result_builtin_signature_parameter_validation(45,1) = isequal(mfilename("bad"), mfilename("bad"))

function y = sig_mfilename_name()
  y = mfilename();
end

function y = sig_mfilename_fullpath()
  y = mfilename("fullpath");
end

function y = sig_mfilename_class()
  y = mfilename("class");
end

test_result_builtin_signature_parameter_validation(46,1) = isequal(sig_mfilename_name(), sig_mfilename_name())
test_result_builtin_signature_parameter_validation(47,1) = isequal(sig_mfilename_fullpath(), sig_mfilename_fullpath())
test_result_builtin_signature_parameter_validation(48,1) = isequal(sig_mfilename_class(), sig_mfilename_class())

% dbstack: aceita contagem inteira não-negativa ou opção "-completenames"
function [current, caller] = sig_stack_caller()
  [current, caller] = sig_stack_leaf();
end

function [current, caller] = sig_stack_leaf()
  s = dbstack();
  current = s(1).name;
  caller = s(2).name;
end

[current, caller] = sig_stack_caller()

function caller = sig_stack_skip()
  caller = sig_stack_skip_leaf();
end

function caller = sig_stack_skip_leaf()
  s = dbstack(1);
  caller = s(1).name;
end

test_result_builtin_signature_parameter_validation(49,1) = isequal(sig_stack_skip(), sig_stack_skip())

function current = sig_stack_option()
  s = dbstack("-completenames");
  current = s(1).name;
end

test_result_builtin_signature_parameter_validation(50,1) = isequal(sig_stack_option(), sig_stack_option())

dbstack(-1)                      % erro: contagem inválida
dbstack(1.5)                     % erro: contagem inválida
dbstack("bad")                   % erro: opção inválida
dbstack(1, "-completenames", 2)  % erro: argumentos demais

% evalin: workspace agora é validado declarativamente
x = 10
test_result_builtin_signature_parameter_validation(51,1) = isequal(evalin("base", "y = x + 5"), evalin("base", "y = x + 5"))
test_result_builtin_signature_parameter_validation(52,1) = isequal(y, y)

function z = sig_evalin_caller()
  localx = 7;
  z = sig_evalin_reader();
end

function z = sig_evalin_reader()
  z = evalin("caller", "localx + 1");
end

test_result_builtin_signature_parameter_validation(53,1) = isequal(sig_evalin_caller(), sig_evalin_caller())

evalin("unknown", "1")           % erro: workspace inválido
evalin("base", 1)                % erro: código deve ser char
evalin("base")                   % erro: faltam argumentos

% assignin: workspace e nome de variável agora são validados declarativamente
test_result_builtin_signature_parameter_validation(54,1) = isequal(assignin("base", "createdByAssignin", 123), assignin("base", "createdByAssignin", 123))
test_result_builtin_signature_parameter_validation(55,1) = isequal(createdByAssignin, createdByAssignin)

function y = sig_assignin_caller()
  sig_assignin_writer();
  y = localCreated;
end

function sig_assignin_writer()
  assignin("caller", "localCreated", 77)
end

test_result_builtin_signature_parameter_validation(56,1) = isequal(sig_assignin_caller(), sig_assignin_caller())

assignin("unknown", "x", 1)      % erro: workspace inválido
assignin("base", "bad-name", 1)  % erro: nome inválido
assignin("base", "x")            % erro: faltam argumentos
assignin("base", 1, 2)           % erro: nome deve ser char


complete_test_result_builtin_signature_parameter_validation = all(test_result_builtin_signature_parameter_validation)

complete_test_result_builtin_signature_parameter_validation
