clear
% Test singularities
A = Inf
A = inf
B = -Inf
B = -inf
C = 1/0 % Inf
D = i/0 % NaN + Infi
E = (1+i)/0 % Inf + Infi
F = (-1+i)/0 % -Inf + Infi
G = (1-i)/0 % Inf - Infi
H = (-1-i)/0 % -Inf - Infi
%
test_result_singularity(1,1) = isequal(0/0, 0/0)
test_result_singularity(2,1) = isequal(Inf/0, Inf/0)
test_result_singularity(3,1) = isequal(0/Inf, 0/Inf)
test_result_singularity(4,1) = isequal(3/0, 3/0)
test_result_singularity(5,1) = isequal(-3/0, -3/0)
test_result_singularity(6,1) = isequal(3i/0, 3i/0)
test_result_singularity(7,1) = isequal(-3i/0, -3i/0)
test_result_singularity(8,1) = isequal((3+3i)/0, (3+3i)/0)
test_result_singularity(9,1) = isequal((-3+3i)/0, (-3+3i)/0)
test_result_singularity(10,1) = isequal((3-3i)/0, (3-3i)/0)
test_result_singularity(11,1) = isequal((-3-3i)/0, (-3-3i)/0)
test_result_singularity(12,1) = isequal(1/Inf, 1/Inf)
test_result_singularity(13,1) = isequal(1/-Inf, 1/-Inf)
test_result_singularity(14,1) = isequal(0/Inf, 0/Inf)
test_result_singularity(15,1) = isequal(0/-Inf, 0/-Inf)
test_result_singularity(16,1) = isequal(2/((3+3i)/0), 2/((3+3i)/0))
test_result_singularity(17,1) = isequal(3/(3i/0), 3/(3i/0))
test_result_singularity(18,1) = isequal(Inf/Inf, Inf/Inf)
test_result_singularity(19,1) = isequal(Inf/-Inf, Inf/-Inf)
test_result_singularity(20,1) = isequal(-Inf/Inf, -Inf/Inf)
test_result_singularity(21,1) = isequal(-Inf/-Inf, -Inf/-Inf)
test_result_singularity(22,1) = isequal(1*Inf, 1*Inf)
test_result_singularity(23,1) = isequal(Inf*1, Inf*1)
test_result_singularity(24,1) = isequal(-1*Inf, -1*Inf)
test_result_singularity(25,1) = isequal(Inf*-1, Inf*-1)
test_result_singularity(26,1) = isequal(-Inf*1, -Inf*1)
test_result_singularity(27,1) = isequal(-Inf*-1, -Inf*-1)
test_result_singularity(28,1) = isequal(Inf*Inf, Inf*Inf)
test_result_singularity(29,1) = isequal(Inf*-Inf, Inf*-Inf)
test_result_singularity(30,1) = isequal(0*Inf, 0*Inf)
test_result_singularity(31,1) = isequal(NaN, NaN)
test_result_singularity(32,1) = isequal(NaN+NaN*i, NaN+NaN*i)
test_result_singularity(33,1) = isequal(-NaN, -NaN)
test_result_singularity(34,1) = isequal(Inf^2, Inf^2)
test_result_singularity(35,1) = isequal(Inf^-2, Inf^-2)
test_result_singularity(36,1) = isequal(Inf^(1/2), Inf^(1/2))
test_result_singularity(37,1) = isequal(Inf^0, Inf^0)
test_result_singularity(38,1) = isequal(Inf^1, Inf^1)
test_result_singularity(39,1) = isequal(Inf^-1, Inf^-1)
test_result_singularity(40,1) = isequal(Inf^Inf, Inf^Inf)
test_result_singularity(41,1) = isequal(Inf^-Inf, Inf^-Inf)
test_result_singularity(42,1) = isequal(Inf^i, Inf^i)
test_result_singularity(43,1) = isequal(i^Inf, i^Inf)
%%% Not yet implemented.
test_result_singularity(44,1) = isequal(1^Inf, 1^Inf)
test_result_singularity(45,1) = isequal(1^(-Inf), 1^(-Inf))
test_result_singularity(46,1) = isequal(1^(Inf*i), 1^(Inf*i))
test_result_singularity(47,1) = isequal(1^(-Inf*i), 1^(-Inf*i))
test_result_singularity(48,1) = isequal((-1)^Inf, (-1)^Inf)
test_result_singularity(49,1) = isequal((-1)^(-Inf), (-1)^(-Inf))
test_result_singularity(50,1) = isequal((-1)^(Inf*i), (-1)^(Inf*i))
test_result_singularity(51,1) = isequal((-1)^(-Inf*i), (-1)^(-Inf*i))
test_result_singularity(52,1) = isequal(i^(Inf), i^(Inf))
test_result_singularity(53,1) = isequal(i^(-Inf), i^(-Inf))
test_result_singularity(54,1) = isequal(i^(Inf*i), i^(Inf*i))
test_result_singularity(55,1) = isequal(i^(-Inf*i), i^(-Inf*i))
test_result_singularity(56,1) = isequal((-i)^Inf, (-i)^Inf)
test_result_singularity(57,1) = isequal((-i)^(-Inf), (-i)^(-Inf))
test_result_singularity(58,1) = isequal((-i)^(Inf*i), (-i)^(Inf*i))
test_result_singularity(59,1) = isequal((-i)^(-Inf*i), (-i)^(-Inf*i))


complete_test_result_singularity = all(test_result_singularity)

complete_test_result_singularity
