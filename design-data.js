// Visual-only data. Gameplay and world coordinates stay in game.js.
// Each character in a sprite row is a palette key; a dot is transparent.
const visualDesign={
  palette:{
    skyTop:'#86b9ee',skyHorizon:'#d8a6b7',grassLight:'#63aa65',grassDark:'#2d7650',
    grassTiles:['#4f9a5c','#5bab62','#479157','#63a967'],road:'#a8987d',roadAlt:'#958870',
    roadEdge:'#f3e3b4',roadMark:'#fff6ca',panel:'#18213a',panelLine:'#9ec2d2',mapRoad:'#b4a58a'
  },
  road:{edge:'#f3e3b4',mark:'#fff6ca',stripeEvery:3,centerEvery:10},
  ground:{spacing:230,variants:['grass','flower']},
  wall:{sampleStep:4,worldSize:44},
  ui:{mapTitle:'COURSE MAP  •  LIVE WORLD POSITION'},
  sprites:{
    kart:{
      legend:{O:'#202433',W:'#eff8f2',D:'#304257',F:'#ff8a4c'},
      frames:{
        rear:['..OOO..','.OBBBO.','OOBBBOO','OOWDWOO','O.....O','O.....O'],
        'rear-left':['..OOO..','.OBBBO.','OOBBBO.','OOWDWOO','O.....O','O.....O'],
        'rear-right':['..OOO..','.OBBBO.','.OBBBOO','OOWDWOO','O.....O','O.....O'],
        side:['..OOO..','.OBBBO.','OOBBBOO','OOWDWOO','O.....O','O.....O']
      }
    },
    tree:{legend:{T:'#2e4930',L:'#579f5c',H:'#97d66d'},pixels:['...H...','..LLL..','.LLLLL.','LLLLLLL','...T...','...T...']},
    grass:{legend:{G:'#276c45',H:'#8dcf6c'},pixels:['..H..','.GGG.','..G..']},
    flower:{legend:{G:'#286d46',F:'#ffe978',P:'#ffffff'},pixels:['..P..','.FFF.','..G..','..G..']},
    wall:{legend:{O:'#423c37',C:'#f8efd2',R:'#df5447'},pixels:['CCCCCC','RRCCRR','OOOOOO','O....O']}
  }
};
