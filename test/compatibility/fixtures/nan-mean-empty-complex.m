% Empty/all-missing means are undefined; complex omission skips whole values.
E=zeros(0,3);
N=[NaN,NaN];
z=[1+i,complex(2,NaN),3+3i,complex(NaN,2)];
compatible=isequal(isnan(mean(E,"omitnan")),[true,true,true]);
compatible=compatible && isnan(mean([])) && isnan(mean(N,"omitnan"));
compatible=compatible && isequal(size(mean([],1)),[1,0]);
compatible=compatible && mean(z,"omitnan")==2+2i && mean([true,false],"omitnan")==0.5;
compatible=compatible && isnan(mean(complex(2,NaN),3,"omitnan"));
compatible=compatible && imag(mean(complex(Inf,2),3))==2 && real(mean(complex(2,Inf),1))==2;
compatible=compatible && isnan(mean([Inf,-Inf,NaN],"omitnan"));
compatible
