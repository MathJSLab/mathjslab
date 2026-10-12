% Measurements with different valid counts in each sensor column.
A=[1,NaN,NaN;3,5,NaN;NaN,7,NaN];
averages=mean(A,"omitnan");
compatible=averages(1)==2 && averages(2)==6 && isnan(averages(3));
compatible=compatible && isequal(mean(A,2,"omitnan"),[1;4;7]);
compatible=compatible && isequal(isnan(mean(A,"includenan")),[true,true,true]);
compatible=compatible && isequal(isnan(A),[false,true,true;false,false,true;true,false,true]);
compatible
