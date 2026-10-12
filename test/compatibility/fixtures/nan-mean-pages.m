% Average corresponding positions across pages, counting each line independently.
P=reshape([NaN,2,3,NaN,5,NaN,7,8],[2,2,2]);
compatible=isequal(mean(P,3,"omitnan"),[5,5;2,8]);
compatible=compatible && isequal(size(mean(P,1,"omitnan")),[1,2,2]);
compatible=compatible && isequal(reshape(mean(P,1,"omitnan"),1,4),[2,3,5,7.5]);
compatible=compatible && isequal(isnan(mean(P,3)),[true,false;true,true]);
compatible
