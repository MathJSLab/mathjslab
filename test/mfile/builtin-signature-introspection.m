% Built-in Signature Introspection

clear

test_result_builtin_signature_introspection(1,1) = isequal(nargin("sin"), nargin("sin"))
test_result_builtin_signature_introspection(2,1) = isequal(nargout("sin"), nargout("sin"))

test_result_builtin_signature_introspection(3,1) = isequal(nargin("plus"), nargin("plus"))
test_result_builtin_signature_introspection(4,1) = isequal(nargout("plus"), nargout("plus"))

test_result_builtin_signature_introspection(5,1) = isequal(nargin("uminus"), nargin("uminus"))
test_result_builtin_signature_introspection(6,1) = isequal(nargout("uminus"), nargout("uminus"))

test_result_builtin_signature_introspection(7,1) = isequal(nargin("feval"), nargin("feval"))
test_result_builtin_signature_introspection(8,1) = isequal(nargout("feval"), nargout("feval"))

test_result_builtin_signature_introspection(9,1) = isequal(nargin("eval"), nargin("eval"))
test_result_builtin_signature_introspection(10,1) = isequal(nargout("eval"), nargout("eval"))

test_result_builtin_signature_introspection(11,1) = isequal(nargin("evalin"), nargin("evalin"))
test_result_builtin_signature_introspection(12,1) = isequal(nargout("evalin"), nargout("evalin"))

test_result_builtin_signature_introspection(13,1) = isequal(nargin("assignin"), nargin("assignin"))
test_result_builtin_signature_introspection(14,1) = isequal(nargout("assignin"), nargout("assignin"))

test_result_builtin_signature_introspection(15,1) = isequal(nargin("dbstack"), nargin("dbstack"))
test_result_builtin_signature_introspection(16,1) = isequal(nargout("dbstack"), nargout("dbstack"))

test_result_builtin_signature_introspection(17,1) = isequal(nargin("exist"), nargin("exist"))
test_result_builtin_signature_introspection(18,1) = isequal(nargout("exist"), nargout("exist"))

test_result_builtin_signature_introspection(19,1) = isequal(nargin("which"), nargin("which"))
test_result_builtin_signature_introspection(20,1) = isequal(nargout("which"), nargout("which"))

test_result_builtin_signature_introspection(21,1) = isequal(nargin("class"), nargin("class"))
test_result_builtin_signature_introspection(22,1) = isequal(nargout("class"), nargout("class"))

test_result_builtin_signature_introspection(23,1) = isequal(nargin("isa"), nargin("isa"))
test_result_builtin_signature_introspection(24,1) = isequal(nargout("isa"), nargout("isa"))

test_result_builtin_signature_introspection(25,1) = isequal(nargin("func2str"), nargin("func2str"))
test_result_builtin_signature_introspection(26,1) = isequal(nargout("func2str"), nargout("func2str"))

test_result_builtin_signature_introspection(27,1) = isequal(nargin("str2func"), nargin("str2func"))
test_result_builtin_signature_introspection(28,1) = isequal(nargout("str2func"), nargout("str2func"))

test_result_builtin_signature_introspection(29,1) = isequal(nargin("functions"), nargin("functions"))
test_result_builtin_signature_introspection(30,1) = isequal(nargout("functions"), nargout("functions"))

test_result_builtin_signature_introspection(31,1) = isequal(nargin("localfunctions"), nargin("localfunctions"))
test_result_builtin_signature_introspection(32,1) = isequal(nargout("localfunctions"), nargout("localfunctions"))

test_result_builtin_signature_introspection(33,1) = isequal(nargin("nargin"), nargin("nargin"))
test_result_builtin_signature_introspection(34,1) = isequal(nargout("nargin"), nargout("nargin"))

test_result_builtin_signature_introspection(35,1) = isequal(nargin("nargout"), nargin("nargout"))
test_result_builtin_signature_introspection(36,1) = isequal(nargout("nargout"), nargout("nargout"))

test_result_builtin_signature_introspection(37,1) = isequal(nargin("inputname"), nargin("inputname"))
test_result_builtin_signature_introspection(38,1) = isequal(nargout("inputname"), nargout("inputname"))

test_result_builtin_signature_introspection(39,1) = isequal(nargin("narginchk"), nargin("narginchk"))
test_result_builtin_signature_introspection(40,1) = isequal(nargout("narginchk"), nargout("narginchk"))

test_result_builtin_signature_introspection(41,1) = isequal(nargin("nargoutchk"), nargin("nargoutchk"))
test_result_builtin_signature_introspection(42,1) = isequal(nargout("nargoutchk"), nargout("nargoutchk"))

function y = builtinmetauser(x, varargin)
  y = nargin("feval") + nargout("feval") + nargin("evalin");
end

test_result_builtin_signature_introspection(43,1) = isequal(builtinmetauser(1, 2, 3), builtinmetauser(1, 2, 3))

nargin("missingBuiltinSignature")  % erro esperado: função inexistente


complete_test_result_builtin_signature_introspection = all(test_result_builtin_signature_introspection)

complete_test_result_builtin_signature_introspection
