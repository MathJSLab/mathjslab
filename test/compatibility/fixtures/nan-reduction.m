% Missing measurements reduce independently along each matrix axis.
A=[2,NaN,NaN;3,4,NaN];
compatible=isequal(sum(A,"omitnan"),[5,4,0]) && isequal(prod(A,"omitnan"),[6,4,1]);
compatible=compatible && isequal(sum(A,2,"omitnan"),[2;7]) && isequal(prod(A,2,"omitnan"),[2;12]);
compatible=compatible && isequal(isnan(sum(A,"includenan")),[false,true,true]) && isequal(isnan(A),[false,true,true;false,false,true]);
compatible
