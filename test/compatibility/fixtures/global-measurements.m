% Total measurements and counts over a matrix, without flattening at the call site.
A=[2,NaN,4;3,5,NaN];
total=sum(A,"all","omitnan");
count=sum(~isnan(A),"all");
compatible=total==14 && count==4 && total/count==3.5;
compatible=compatible && isnan(sum(A,"all")) && isequal(size(total),[1,1]);
compatible=compatible && isequal(isnan(A),[false,true,false;false,false,true]);
compatible
