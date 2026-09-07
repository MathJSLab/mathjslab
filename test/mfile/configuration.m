clear
help getconfig
help configure
test_result_configuration(1,1) = isequal(getconfig('precision'), getconfig('precision'))
test_result_configuration(2,1) = isequal(configure('precision', 20), configure('precision', 20))
test_result_configuration(3,1) = isequal(getconfig('precision'), getconfig('precision'))
test_result_configuration(4,1) = isequal(configure(), configure())
test_result_configuration(5,1) = isequal(getconfig(), getconfig())
test_result_configuration(6,1) = isequal(configure('crypto', true), configure('crypto', true))
test_result_configuration(7,1) = isequal(getconfig(), getconfig())
test_result_configuration(8,1) = isequal(configure('real', 'number'), configure('real', 'number'))
test_result_configuration(9,1) = isequal(getconfig(), getconfig())
test_result_configuration(10,1) = isequal(configure('real', 'decimal'), configure('real', 'decimal'))
test_result_configuration(11,1) = isequal(getconfig(), getconfig())


complete_test_result_configuration = all(test_result_configuration)

complete_test_result_configuration
