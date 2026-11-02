% Concatenate after test/node/fixtures/resumable-validation.m.
global validationTrace validationCleanup;
validationTrace=0; validationCleanup=0;
value=validated();
input_output_ok=value==4 && validationTrace==12342;
validationTrace=0;
value=validatedRepeating([1,2],[3,4,5]);
repeating_input_ok=value==2 && validationTrace==2323;
validationTrace=0;
[~,a,b]=validatedRepeatingOutput();
repeating_output_ok=a==3 && b==4 && validationTrace==22;
validationTrace=0;
value=validatedNamed();
named_ok=value==3 && validationTrace==123;
box=ValidationBox();
validationTrace=0;
box.x=5;
property_ok=box.x==5 && validationTrace==2;
rejected=false;
try
  box.x=-1;
catch
  rejected=true;
end
validation_ok=input_output_ok && repeating_input_ok && repeating_output_ok && named_ok && property_ok && rejected && box.x==5;
validation_ok
