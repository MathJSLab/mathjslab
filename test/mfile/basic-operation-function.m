clear
% Test basic operations and functions
test_result_basic_operation_function(1,1) = isequal(10^2, 10^2)
test_result_basic_operation_function(2,1) = isequal((-10)^2, (-10)^2)
test_result_basic_operation_function(3,1) = isequal(2^2, 2^2)
test_result_basic_operation_function(4,1) = isequal(2^-1, 2^-1)
test_result_basic_operation_function(5,1) = isequal(sqrt(2), sqrt(2))
test_result_basic_operation_function(6,1) = isequal(2^(1/2), 2^(1/2))
test_result_basic_operation_function(7,1) = isequal(2^(1/3), 2^(1/3))
test_result_basic_operation_function(8,1) = isequal((-2)^(1/2), (-2)^(1/2))
test_result_basic_operation_function(9,1) = isequal((-1)^(1/2), (-1)^(1/2))
test_result_basic_operation_function(10,1) = isequal(abs(-3), abs(-3))
test_result_basic_operation_function(11,1) = isequal(abs(1+i), abs(1+i))
test_result_basic_operation_function(12,1) = isequal(log2(16), log2(16))
test_result_basic_operation_function(13,1) = isequal(logb(2,-1), logb(2,-1))
test_result_basic_operation_function(14,1) = isequal(logb(0,8), logb(0,8))
test_result_basic_operation_function(15,1) = isequal(root(64,3), root(64,3))
test_result_basic_operation_function(16,1) = isequal(exp(i*pi), exp(i*pi))
test_result_basic_operation_function(17,1) = isequal(e^(i*pi), e^(i*pi))
f = @(x) sin(x).^2+cos(x).^2
trig_cycle_20=[0,pi/6,pi/4,pi/3;pi/2,2*pi/3,3*pi/4,5*pi/6;pi,7*pi/6,5*pi/4,4*pi/3;3*pi/2,5*pi/3,7*pi/4,11*pi/6;2*pi,5*pi/2,3*pi,7*pi/2]
A=trig_cycle_20
test_result_basic_operation_function(18,1) = isequal(sin(A).^2+cos(A).^2, sin(A).^2+cos(A).^2)
test_result_basic_operation_function(19,1) = isequal(f(3.14), f(3.14))
z=1
test_result_basic_operation_function(20,1) = isequal(f(z), f(z))
test_result_basic_operation_function(21,1) = isequal(f(A), f(A))
test_result_basic_operation_function(22,1) = isequal(gamma(5), gamma(5))
test_result_basic_operation_function(23,1) = isequal(gamma(6), gamma(6))
test_result_basic_operation_function(24,1) = isequal(gamma(7), gamma(7))
test_result_basic_operation_function(25,1) = isequal(gamma(4+i), gamma(4+i))
test_result_basic_operation_function(26,1) = isequal(factorial(5), factorial(5))
test_result_basic_operation_function(27,1) = isequal(factorial(13), factorial(13))
test_result_basic_operation_function(28,1) = isequal(factorial(21), factorial(21))
test_result_basic_operation_function(29,1) = isequal(factorial(22), factorial(22))
factorial(5.4) % error
test_result_basic_operation_function(30,1) = isequal(factorial(999999999999999), factorial(999999999999999))
%
A()=2
test_result_basic_operation_function(31,1) = isequal(A, A)
test_result_basic_operation_function(32,1) = isequal(A(), A())
test_result_basic_operation_function(33,1) = isequal(A(1), A(1))
A(2) % error
%
test_result_basic_operation_function(34,1) = isequal(arg(0), arg(0))
test_result_basic_operation_function(35,1) = isequal(arg(-0), arg(-0))
test_result_basic_operation_function(36,1) = isequal(arg(0i), arg(0i))
test_result_basic_operation_function(37,1) = isequal(arg(-0i), arg(-0i))
test_result_basic_operation_function(38,1) = isequal(arg(0-0i), arg(0-0i))
test_result_basic_operation_function(39,1) = isequal(arg(0+0i), arg(0+0i))
test_result_basic_operation_function(40,1) = isequal(arg(-0+0i), arg(-0+0i))
test_result_basic_operation_function(41,1) = isequal(arg(-0-0i), arg(-0-0i))
test_result_basic_operation_function(42,1) = isequal(arg(1-i), arg(1-i))
test_result_basic_operation_function(43,1) = isequal(arg(-1-i), arg(-1-i))
test_result_basic_operation_function(44,1) = isequal(arg(-1+i), arg(-1+i))
test_result_basic_operation_function(45,1) = isequal(arg(1+i), arg(1+i))


complete_test_result_basic_operation_function = all(test_result_basic_operation_function)

complete_test_result_basic_operation_function
