"""Planos de El Dorado parte 2.

(id, inicio en la voz original, modelo, época, imagen, movimiento, referencias)
modelo: S = Seedance 2.5 (planos clave), K = Kling 3.0
referencias: C = cacique muisca, R = Walter Raleigh, P = Gonzalo Pizarro, A = Lope de Aguirre
Todo con sonido nativo del modelo (ambiente y efectos, sin música ni voces).
"""
import json

from plan import gen, planos

C69 = "rural Colombia in 1969, Cundinamarca Andes near Pasca, period-correct 1960s campesino clothing (wool ruanas, straw hats, rubber boots)"
AMZ = "historically accurate 1541 Spanish expedition from Quito into the Amazon rainforest, period-correct conquistador armor and indigenous Andean porters"
AGU = "historically accurate 1561 Spanish expedition on the Amazon and Orinoco rivers, period-correct 16th century Spanish soldiers and brigantines"
GUA = "historically accurate Guatavita crater lake in the Colombian Andes in 1580, Spanish colonial New Granada, Muisca laborers"
ENG = "historically accurate Elizabethan and Jacobean England 1595-1618"
ORI = "historically accurate 1618 English expedition on the Orinoco river in Guiana"
E04 = "historically accurate 1904 Colombia, Edwardian-era British mining engineers and Colombian workers"
HOY = "present day"

P = [
("E01", 0.0, "S", C69, "Two Colombian campesinos in wool ruanas and straw hats, one holding a kerosene lantern, cautiously entering the mouth of a dark rock cave on a green Andean hillside at dusk, mist", "The two men duck into the cave, the lantern light swings over the wet rock. Sound: wind, dripping water, footsteps on gravel. No music, no speech.", ""),
("E02", 3.14, "K", C69, "Inside a dark rock cave lit only by a kerosene lantern, an old brown clay vessel half-buried in dry earth against the rock wall, dust in the air", "Slow push-in toward the clay vessel as the lantern light flickers.", ""),
("E03", 6.48, "K", C69, "Close-up of a campesino's rough hands brushing earth off an old Muisca clay vessel and reaching inside, kerosene lantern light", "The hands carefully lift the lid and reach into the vessel.", ""),
("E04", 8.5, "S", C69, "The legendary gold Muisca raft (Balsa Muisca) revealed in lantern light: a small flat raft of gold filigree with a large central gold cacique figure wearing a headdress surrounded by smaller gold attendant figures, resting in a campesino's cupped hands inside a dark cave", "The hands slowly raise the golden raft into the lantern light, gold glints and sparkles, dust floats. Sound: soft breath, dripping water, a faint echo in the cave. No music, no speech.", ""),
("E05", 12.48, "K", C69, "Macro close-up of the small gold Muisca raft figurine lying on a campesino's palm, showing it is smaller than the hand, lantern light", "Very slow orbit around the tiny golden raft, light sliding over the gold.", ""),
("E06", 14.84, "K", AMZ, "A rusted Spanish morion helmet and a broken sword overgrown with roots and moss on the floor of a dark Amazon rainforest, rain", "Rain drips on the rusted helmet, slow push-in, mist moving.", ""),
("E07", 18.38, "K", E04, "An abandoned dried muddy crater with a rusted steam pump and broken iron pipes, cracked earth, grey sky, no people", "Slow drift across the rusted abandoned machinery, dust blowing in the wind.", ""),
("E08", 22.4, "S", AMZ, "Gonzalo Pizarro on a horse in steel breastplate and morion leading a long column of Spanish soldiers, hundreds of indigenous porters, horses, pigs and dogs out of colonial Quito in 1541, Andes volcano behind, morning", "The column marches past the camera toward the misty mountains, Pizarro raises his hand to advance. Sound: hooves, marching feet, pigs grunting, dogs barking, wind. No music, no speech.", "P"),
("E09", 26.1, "K", AMZ, "A misty tropical forest of wild cinnamon trees with reddish bark in the eastern Andes, a Spanish soldier peeling bark with a knife and smelling it", "The soldier peels the cinnamon bark and smells it, leaves sway in the mist.", ""),
("E10", 29.0, "K", AMZ, "A long column of about two hundred Spanish soldiers in quilted cotton armor and steel helmets with pikes and crossbows marching down a steep muddy trail into the green Amazon jungle", "The soldiers march down the trail, armor clanking, mist between the trees.", ""),
("E11", 31.74, "K", AMZ, "Hundreds of indigenous Andean porters bent under heavy loads held by tumplines on their foreheads, walking barefoot in the mud of a jungle trail, Spanish guards behind", "The porters struggle forward step by step under the heavy loads in the mud.", ""),
("E12", 33.62, "K", AMZ, "Horses, a herd of pigs and hunting dogs driven along a narrow jungle trail by Spanish soldiers in 1541", "The pigs and dogs push along the trail, a horse slips in the mud.", ""),
("E13", 36.06, "S", AMZ, "The Spanish expedition struggling through torrential rain in the Amazon rainforest, men knee-deep in brown mud, a horse sinking, exhausted porters collapsing, dark green jungle", "Heavy rain pours, men pull a sinking horse out of the mud, a porter falls to his knees. Sound: pouring rain, thunder, horses neighing, men groaning. No music, no speech.", ""),
("E14", 39.92, "K", AMZ, "Starving Spanish soldiers with hollow cheeks sitting around a weak smoky fire under a rain-soaked jungle canopy, an empty food sack on the ground", "Rain drips, the fire smokes, a soldier shakes the empty sack.", ""),
("E15", 41.64, "K", AMZ, "Hungry Spanish soldiers roasting a pig on a wooden spit over a campfire in the jungle at night", "The spit turns slowly, fat drips into the fire, flames flare.", ""),
("E16", 43.44, "K", AMZ, "A starving Spanish soldier sitting alone in the jungle at night holding an empty dog leash of leather, looking down in guilt, campfire light", "He lowers his head and tightens his grip on the empty leash, the fire crackles.", ""),
("E17", 45.24, "K", AMZ, "A group of starving Spanish soldiers standing in the rain around a dead horse lying in the jungle mud, seen from a distance, sombre, no blood", "Rain falls on the silent men, one removes his helmet, slow push-in.", ""),
("E18", 47.14, "K", AMZ, "Close-up of an iron pot boiling over a jungle fire with leather saddle straps and belts cut into pieces inside, a starving soldier stirring it", "The leather pieces churn in the boiling water, steam rises.", ""),
("E19", 50.18, "K", AMZ, "Gonzalo Pizarro giving orders to Francisco de Orellana, a one-eyed conquistador with a patch over one eye, on the muddy bank of a wide jungle river beside a newly built wooden brigantine", "Pizarro points down the river, Orellana nods and turns toward the boat.", "P"),
("E20", 54.18, "S", AMZ, "A small 16th century Spanish brigantine with a patched sail and soldiers on board sailing away down an immense brown jungle river into the mist", "The brigantine drifts away with the current and slowly disappears into the mist while the camera stays on the shore. Sound: river current, birds, oars creaking. No music, no speech.", ""),
("E21", 57.68, "K", AMZ, "Aerial view of the immense mouth of the Amazon river opening into the Atlantic ocean, brown water meeting blue sea, a tiny sailing brigantine, 1542", "Slow aerial glide over the huge river mouth toward the open ocean.", ""),
("E22", 60.72, "K", AMZ, "Gonzalo Pizarro and a few dozen ragged, barefoot, emaciated Spanish survivors in torn clothes arriving at the edge of colonial Quito, townspeople staring in shock", "The survivors limp forward, Pizarro leans on a stick, townspeople step back.", "P"),
("E23", 63.78, "K", AMZ, "Close-up of bare, wounded, muddy feet walking slowly on cobblestones of colonial Quito", "The bare feet step slowly forward on the stones.", ""),
("E24", 66.5, "K", AGU, "Several 16th century Spanish brigantines and rafts crowded with soldiers going down a dark wide Amazon river at dusk in 1560, dense jungle on both sides", "The boats drift down the river, oars dip into the dark water, mist rises.", ""),
("E25", 70.66, "S", AGU, "Lope de Aguirre, a gaunt lame Spanish soldier with wild staring eyes and a grey-black beard in a battered morion, limping along the deck of a brigantine on a dark river, stormy sky", "Aguirre limps forward, stops and stares straight at the camera with a cold, unsettling look. Sound: river, creaking wood, distant thunder. No music, no speech.", "A"),
("E26", 74.82, "K", AGU, "Night in a jungle camp, the canvas wall of a tent lit from inside by a candle, the shadows of several men with swords attacking a man inside, silhouettes only, no blood", "The shadows lunge and the candle inside goes out.", ""),
("E27", 76.4, "K", AGU, "Lope de Aguirre raising his sword in front of rebel Spanish soldiers on a riverbank at night, torches, a torn Spanish royal banner lying in the mud", "Aguirre raises his sword, the soldiers raise their weapons, torches flare.", "A"),
("E28", 78.22, "K", AGU, "Lope de Aguirre writing a letter with a quill on parchment by candlelight inside a rough riverside hut, his face tense and furious", "The quill scratches fast across the parchment, the candle flickers.", "A"),
("E29", 82.06, "K", AGU, "Spanish royal soldiers with arquebuses and pikes surrounding a colonial adobe house in Barquisimeto, Venezuela, 1561, dusk", "The soldiers close in around the house, pikes lowered.", ""),
("E30", 84.48, "S", AGU, "Lope de Aguirre kneeling in a dark adobe room in front of his frightened teenage daughter in a simple 16th century dress, holding her face with one hand, a single candle, tragic atmosphere, no weapons visible", "Aguirre looks at his daughter with despair, she closes her eyes, the candle flame trembles and slowly goes out. Sound: heavy breathing, soldiers shouting outside, a door being hammered. No music, no speech.", "A"),
("E31", 89.72, "K", AGU, "An empty dark jungle river at dusk covered in mist, no boats", "Mist slowly moves over the still water, slow drift.", ""),
("E32", 91.88, "K", AGU, "Many simple wooden crosses of graves along a muddy jungle riverbank, rain", "Slow dolly along the line of crosses as rain falls.", ""),
("E33", 95.68, "K", GUA, "The round emerald-green crater lake of Guatavita seen from its rim, green Andean hills, low clouds, 1580", "Slow drone move along the crater rim over the still lake.", ""),
("E34", 97.74, "K", GUA, "Underwater view of the dark green bottom of a lake, gold Muisca figurines and emeralds half-buried in the mud glinting in faint light rays", "Light rays sway, the gold glints in the mud, slow push-in.", ""),
("E35", 101.3, "K", GUA, "Antonio de Sepúlveda, a Spanish merchant of 1580 in a black doublet, ruff and hat, holding a ledger and pointing at the rim of the Guatavita crater lake", "He points at the crater rim and turns to an overseer.", ""),
("E36", 105.0, "S", GUA, "Hundreds of indigenous Muisca laborers digging a huge deep V-shaped cut into the rim of the Guatavita crater lake with wooden tools and baskets of earth, Spanish overseers watching", "The laborers dig and carry baskets of earth up the slope in long lines. Sound: digging, baskets, shouting overseers, wind. No music, no speech.", ""),
("E37", 108.06, "K", GUA, "Water gushing out through a deep cut in the rim of the Guatavita crater lake, the lake level dropping and exposing muddy banks", "The water rushes out through the cut, the shoreline recedes.", ""),
("E38", 110.14, "K", GUA, "Muddy hands pulling small gold Muisca figurines out of the exposed mud of the lake bed", "The hands pull a gold figure out of the mud and wipe it.", ""),
("E39", 112.28, "K", GUA, "Close-up of a huge raw green emerald the size of a hen's egg in a dirty palm, sunlight", "The hand slowly turns the emerald, light shines through it.", ""),
("E40", 114.68, "S", GUA, "The walls of the deep cut in the rim of the Guatavita crater lake collapsing in a landslide of mud and rocks onto the laborers in the trench below, dust and chaos", "The earth walls give way and a wave of mud crashes into the trench as workers run. Sound: rumble, cracking earth, screams in the distance, falling rocks. No music, no speech.", ""),
("E41", 118.52, "K", GUA, "An old poor Spanish man, Antonio de Sepúlveda, sitting alone in a bare cold room with an empty chest and a candle, 1580s New Granada", "He stares at the candle, slow push-in.", ""),
("E42", 120.26, "K", HOY, "The V-shaped notch still visible today in the green rim of the Guatavita crater lake, Colombia, cloudy day, lush vegetation", "Slow aerial move toward the old notch in the crater rim.", ""),
("E43", 123.2, "K", ENG, "Sir Walter Raleigh in 1595, middle-aged with dark pointed beard, rich doublet and pearl earring, leaning over a hand-drawn map of Guiana and the Orinoco by candlelight", "Raleigh traces a route on the map with his finger, the candle flickers.", "R"),
("E44", 128.92, "K", ENG, "Sir Walter Raleigh kneeling and presenting a leather-bound book to Queen Elizabeth I on her throne in a candlelit Elizabethan court, courtiers watching", "The queen takes the book and looks at him, courtiers whisper.", "R"),
("E45", 131.5, "S", ENG, "Sir Walter Raleigh, older with grey beard, in a cold stone cell of the Tower of London writing by candlelight, a small barred window", "Raleigh writes, stops and looks up at the barred window as the seasons pass: light changes from winter grey to summer gold. Sound: quill, wind, distant bells. No music, no speech.", "R"),
("E46", 136.3, "K", ENG, "King James I of England on his throne in 1616, stern, pointing a finger in warning, dark wood-panelled hall", "The king leans forward and raises a warning finger.", ""),
("E47", 138.7, "S", ORI, "English soldiers in morion helmets attacking and burning the small Spanish river settlement of San Thomé on the Orinoco at night, thatched roofs on fire", "Soldiers charge through the burning village, smoke and sparks fill the air. Sound: fire, musket shots, shouting, alarm bell. No music, no speech.", ""),
("E48", 141.82, "K", ORI, "A young English officer in a breastplate falling to his knees amid smoke and fire at night, his comrades turning toward him, no blood", "The young man drops his sword and falls, smoke drifts.", ""),
("E49", 144.18, "K", ORI, "Old Sir Walter Raleigh standing alone on the deck of a galleon at dusk, grief-stricken, empty hands, grey sea", "Raleigh looks at his empty hands and then at the sea.", "R"),
("E50", 146.42, "K", ENG, "Old Sir Walter Raleigh kneeling at the wooden execution block on a scaffold in Westminster in 1618, the hooded executioner raising the axe, grey morning, crowd below", "The executioner lifts the axe; the camera cuts to the grey sky before any blow.", "R"),
("E51", 149.3, "K", E04, "British engineers in 1904 in pith helmets and tweed suits with a large steam pump and the stone entrance of a drainage tunnel at the Guatavita crater lake, Colombian workers", "The steam pump puffs smoke, workers push a cart out of the tunnel.", ""),
("E52", 153.6, "S", E04, "The drained crater of Guatavita lake in 1904: a vast wet muddy bowl with a small pool left in the center, workers in the mud with shovels, a steam pump on the rim", "Slow aerial reveal of the drained crater as the last water drains away. Sound: dripping mud, steam engine, wind. No music, no speech.", ""),
("E53", 156.1, "K", E04, "Close-up of mud baked hard and cracked like cement under harsh sun on the bottom of a drained lake, a shovel stuck in it", "A worker hits the cracked hard mud with a pickaxe, it barely chips.", ""),
("E54", 159.68, "K", E04, "An auction room in London around 1910, an auctioneer with a gavel, a few small gold Muisca figurines on a velvet table, gentlemen in suits bidding", "The auctioneer raises the gavel and brings it down.", ""),
("E55", 163.62, "K", E04, "Rusted abandoned steam machinery and an overgrown tunnel entrance on the rim of the Guatavita crater, grass growing through the iron, mist", "Slow drift past the rusted machinery, grass sways in the wind.", ""),
("E56", 168.28, "S", C69, "Inside a dark rock cave, the small gold Muisca raft emerging from dry mud and earth inside a broken clay vessel, lit by a kerosene lantern", "The lantern light slowly reveals the gold raft as dust settles on it. Sound: dripping water, soft wind at the cave mouth. No music, no speech.", ""),
("E57", 174.68, "S", HOY, "The gold Balsa Muisca displayed alone in a glass case in the dark exhibition hall of the Museo del Oro in Bogotá, spotlight, reflections on the glass, a few visitors silhouetted", "Slow push-in toward the golden raft in the glass case while visitors pass in silhouette. Sound: quiet museum ambience, soft footsteps. No music, no speech.", ""),
("E58", 179.76, "K", HOY, "The round Guatavita crater lake at golden sunset seen from the rim, calm water, green hills, peaceful", "Very slow push-in over the calm lake as the sun sets.", ""),
]


def imagen(desc, era):
    # en la parte 1, 7 de 58 imagenes salieron giradas 90 grados: se pide la orientacion de forma explicita
    return (f"Tall vertical 9:16 composition, the top of the frame is up: sky or ceiling at the top, ground at the bottom, "
            f"people standing upright with heads toward the top. {desc}. Camera held level, horizon horizontal. Photorealistic cinematic film still, {era}, deep green and warm gold palette, "
            f"atmospheric mist, film grain, no text, no watermark.")


def movimiento(mov, modelo):
    if modelo == "S":
        return mov
    return mov + " Natural ambient sound effects only, no music, no speech, no voices."


if __name__ == "__main__":
    tiempos = {pid: (a, b) for pid, a, b in planos(P)}
    out, tot, tot_s, tot_k = [], 0, 0, 0
    for pid, _, mod, era, desc, mov, ref in P:
        a, b = tiempos[pid]
        g = gen(b - a, mod)
        c = g * (440 if mod == "S" else 105)
        tot += c; tot_s += c if mod == "S" else 0; tot_k += c if mod == "K" else 0
        out.append({"id": pid, "modelo": mod, "dur": g, "ini": a, "fin": b,
                    "imagen": imagen(desc, era), "movimiento": movimiento(mov, mod), "refs": ref})
    json.dump(out, open("planos.json", "w"), ensure_ascii=False, indent=1)
    print("planos", len(P), "seedance", tot_s, "kling", tot_k, "video", tot,
          "imagenes", len(P) * 75, "total", tot + len(P) * 75)
