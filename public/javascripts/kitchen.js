const deadFish = `                                
       ████  █  █  █  █  █            █   
    ██  ███  █  █   █  █    █       ███   
  ████ ███████████████████████████████    
   ████████  █   █  █  █  █ █  █ █ ████   
     ██████  █  █        █  █        ██   
         █      █  █  █                   
`;
const fish = `
      /\\
    _/./
 ,-'    \`-:..-'/
: o )      _  (
"\`-....,--; \`-.\\
    \`'   \`
`;

$(document).ready(function() {
    const $fishArea = $('#fish-area');
    const $fishFeeder = $('#fish-feeder');

    $fishArea.text(fish);

    $fishFeeder.on('click', function() {
        $fishArea.text(deadFish);
        $fishFeeder.prop('disabled', true);
        $fishFeeder.after('<p class="mt-3">You killed the fish >:(</p>')
    });
});