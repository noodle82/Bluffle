const MESSAGES = [
"You don’t have to be the biggest star to make someone’s night a little brighter.",
"Kindness is a gift you can give every day. Even a tiny kind thing can feel enormous to someone else.",
"You are wonderfully, perfectly you. The world has room for your very own kind of sparkle.",
"Brave doesn’t mean never feeling wobbly. It means taking one little step, even when you do.",
"A mistake is a little sign that you’re learning. Be as kind to yourself as you would be to a friend.",
"Some days are for big adventures. Some days are for cosy socks and a rest. Both kinds of days matter.",
"The loveliest gifts can’t be wrapped: a listening ear, a helping hand, a hug someone wants.",
"You can’t do everything yet. That little word, yet, leaves the door open for wonderful things.",
"Like snowflakes, no two people are quite the same. Your differences are part of your magic.",
"When a feeling grows big, take a slow breath. You can ask someone you trust to help you carry it.",
"You don’t need a special reason to tell someone you’re glad they’re here.",
"Little by little is how snowflakes build a snowman. Little by little is how you grow, too.",
"It’s okay to ask for help. Even Santa has a whole workshop of helpers.",
"Being a good friend starts with making a little room for someone else to join in.",
"There is no race to become yourself. Grow at your own lovely pace.",
"Try noticing three small things that make you smile today. Sometimes joy hides in tiny places.",
"You can be proud of trying, even when things don’t turn out quite how you hoped.",
"You can say no kindly. Your comfort and your feelings matter, too.",
"A quiet voice can have a wonderful idea. Your thoughts deserve to be heard.",
"Sharing a laugh is a little way of saying: I’m happy to be here with you.",
"If someone’s day feels chilly, a small act of kindness can be a warm little scarf.",
"You are loved on your sparkly days and your grumpy days. You don’t have to earn it.",
"Christmas magic grows when we include each other. Who could you invite into your fun today?",
"The best bit of Christmas is the love we give and share. Carry a little of it with you all year."
];
const JOKES = [
["What do snowmen eat for breakfast?","Frosted flakes!"],["What do you call a reindeer with bad manners?","Rude-olph!"],["Why did the Christmas tree visit the hairdresser?","It needed a trim!"],["What do elves learn at school?","The elf-abet!"],["What do you call a snowman’s dog?","A slush puppy!"],["Why was the snowman looking through the carrots?","He was picking his nose!"],["What does Santa do in his garden?","Ho ho hoe!"],["What is a Christmas tree’s favourite sweet?","Orna-mints!"],["What do you call Santa when he takes a break?","Santa Pause!"],["What do you get if you cross a snowman and a vampire?","Frostbite!"],["What do reindeer hang on their Christmas trees?","Horn-aments!"],["How do Christmas trees get online?","They log in!"],["What kind of photos do elves take?","Elfies!"],["What falls at the North Pole but never gets hurt?","Snow!"],["Why did the gingerbread man go to the doctor?","He felt crummy!"],["What do you call a very old snowman?","Water!"],["What is Santa’s favourite type of music?","Wrap music!"],["How does a snowman get to work?","By icicle!"],["Why did the bauble go to school?","To get a little brighter!"],["Where do snowmen keep their money?","In a snow bank!"],["What do you call a cat on the beach in December?","Sandy Claws!"],["What do you call a reindeer who tells jokes?","A comedi-deer!"],["Why are Christmas trees bad at sewing?","They keep dropping their needles!"],["What did one snowflake say to the other?","You’re one of a kind!"]
];
const TOYS = ['Pip the snow sprite','Mallow the squishy','A pocket of snowfall','Moss the forest friend','Peachy little cloud','The wishing globe','Bumble the starling','Berry jelly bear','The tiny winter village','Noodle the moon puff','Minty the marshmallow','The northern lights globe','Clover the cosy creature','Pudding the squishy','A little gingerbread world','Twinkle the sleepy sprite','Rosie the jelly heart','The woodland snow globe','Pebble the pocket pal','Sunny the star squishy','A tiny Christmas tree','Wisp the winter friend','The rainbow squishy','Santa’s magical snow globe'];
const GAMES = [
['penguin','Penguin launch','Give a little penguin a big snowy adventure.','🐧'],['face','Funny face studio','Stretch, squish and swirl your silliest selfie.','🪞'],['memory','Mitten match','Find the cosy pairs hiding in the snow.','🧤'],['catch','Snowflake scooper','Catch a flurry of falling snowflakes.','❄'],['stars','Star catcher','Tap the twinkles before they disappear.','⭐'],['memory','Gingerbread twins','Match the treats in the Christmas kitchen.','🍪'],['catch','Present patrol','Help collect Santa’s falling presents.','🎁'],['penguin','Polar express launch','Catch a tailwind over the frozen sea.','🧊'],['stars','Light up the night','Catch little lights in the winter sky.','✨'],['memory','Reindeer reunion','Find each reindeer a festive friend.','🦌'],['catch','Candy cane rain','Scoop up a shower of stripy sweets.','🍬'],['face','Elfie yourself','Make the most wonderfully wobbly elfie.','🧝'],['stars','Jingle bell dash','Tap as many jingle bells as you can.','🔔'],['memory','Toy workshop pairs','Reunite the toys in Santa’s workshop.','🧸'],['penguin','Moonlight penguin','Soar through a twinkling winter night.','🌙'],['catch','Cookie catcher','Catch some freshly baked festive treats.','🍪'],['face','Snowman selfie','Give your selfie a snowball-sized wobble.','⛄'],['stars','Snow sparkle sprint','Chase the glimmers in a snowy sky.','❄'],['memory','Bauble buddies','Find the matching Christmas decorations.','🔴'],['catch','Reindeer snack time','Collect crunchy carrots for the team.','🥕'],['penguin','North Pole hop','Bounce your way towards the North Pole.','🧭'],['face','Christmas giggle mirror','A silly mirror full of Christmas cheer.','🎭'],['stars','Santa’s star trail','Help light the way for Santa’s sleigh.','🌟'],['memory','Christmas Eve magic','One last lovely matching adventure.','🎄']
];
const PALETTE = ['#adcabb','#eab8a7','#e9c681','#c2b9d5','#b8d4d4','#c9d5b3'];
GAMES[4]=['voice','Silly Christmas voices','Say hello as a tiny elf, a gentle giant or a jingle robot.','🎙'];
const DAYS = Array.from({length:24},(_,i)=>({day:i+1,message:MESSAGES[i],joke:JOKES[i],toy:TOYS[i],type:i%3,colour:PALETTE[i%6],game:GAMES[i]}));
if(typeof module!=='undefined') module.exports={DAYS};
