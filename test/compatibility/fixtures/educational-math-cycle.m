% Native library equivalents of existing Horner, trapezoidal and Romberg examples.
educationalOk=isequal(polyval([2,-3,0,5],[0,1,2]),[5,4,9]);
educationalOk=educationalOk && isequal(polyder([2,-3,0,5]),[6,-6,0]);
educationalOk=educationalOk && isequal(conv([1,-1],[1,-2]),[1,-3,2]);
educationalNodes=linspace(0,1,41);
educationalValues=polyval([1,0,0],educationalNodes);
educationalArea=trapz(educationalNodes,educationalValues);
educationalCumulative=cumtrapz(educationalNodes,educationalValues);
educationalOk=educationalOk && abs(educationalArea-1/3)<0.0002 && abs(educationalCumulative(end)-educationalArea)<1e-12;
educationalCoarse=linspace(0,1,5);
educationalFine=linspace(0,1,9);
educationalRomberg=(4*trapz(educationalFine,educationalFine.^2)-trapz(educationalCoarse,educationalCoarse.^2))/3;
educationalOk=educationalOk && abs(educationalRomberg-1/3)<1e-12;
function value=educationalArgument(value), pause(0.001); end
educationalWaited=trapz(educationalArgument([0,1,3]),educationalArgument([0,2,6]));
educationalOk=educationalOk && educationalWaited==9;
educationalOk
