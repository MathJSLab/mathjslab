clear
% Test functions
% https://www.mathworks.com/help/matlab/matlab_prog/local-functions.html
function [avg, med] = mystats(x)
    n = length(x);
    avg = mymean(x,n);
    med = mymedian(x,n);
end

function a = mymean(v,n)
    % MYMEAN Example of a local function.

    a = sum(v)/n;
end

function m = mymedian(v,n)
    % MYMEDIAN Another example of a local function.

    w = sort(v);
    if rem(n,2) == 1
        m = w((n + 1)/2);
    else
        m = (w(n/2) + w(n/2 + 1))/2;
    end
end

test_result_function(1,1) = true

complete_test_result_function = all(test_result_function)

complete_test_result_function
