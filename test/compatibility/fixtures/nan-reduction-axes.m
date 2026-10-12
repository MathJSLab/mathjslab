% Page reductions and complex missing values preserve axis and value order.
P=reshape([NaN,2,3,NaN,5,6,NaN,8],[2,2,2]);
z=[1+i,complex(2,NaN),complex(NaN,3),2+i];
compatible=isequal(sum(P,3,"omitnan"),[5,3;8,8]) && isequal(prod(P,3,"omitnan"),[5,3;12,8]);
compatible=compatible && sum(z,"omitnan")==3+2i && prod(z,"omitnan")==1+3i;
compatible=compatible && sum([true,false,true],"omitnan")==2 && prod([true,false,true],"omitnan")==0;
compatible=compatible && imag(prod(complex(Inf,2),3,"omitnan"))==2 && real(prod(complex(2,Inf),1,"omitnan"))==2;
compatible


