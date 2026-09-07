clear
% debug commands
test_result_debug(1,1) = isequal(__operators__, __operators__)
test_result_debug(2,1) = isequal(__keywords__, __keywords__)
test_result_debug(3,1) = isequal(__builtins__, __builtins__)
test_result_debug(4,1) = isequal(__list_functions__, __list_functions__)
test_result_debug(5,1) = isequal(localfunctions, localfunctions)
test_result_debug(6,1) = isequal(__dump_symtab_info__, __dump_symtab_info__)


complete_test_result_debug = all(test_result_debug)

complete_test_result_debug
