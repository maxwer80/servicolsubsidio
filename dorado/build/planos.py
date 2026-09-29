"""Planos de El Dorado parte 1.

(id, inicio en la voz original, modelo, imagen, movimiento, referencias)
modelo: S = Seedance 2.5 (planos clave), K = Kling 3.0
referencias: C = cacique muisca, Q = Gonzalo Jiménez de Quesada, R = Walter Raleigh
Todo con sonido nativo del modelo (ambiente y efectos, sin música ni voces).
"""
import json

from plan import gen, planos

LON = "London 1618, historically accurate Jacobean England"
CORTE = "Habsburg Spain and Augsburg in 1528, historically accurate Renaissance Europe"
NG = "historically accurate 16th century New Granada (Colombia), period-correct Spanish conquistador and Muisca costumes, weapons and architecture"
MU = "historically accurate pre-Columbian Muisca culture of the Colombian Andes"

P = [
("D01", 0.0, "K", LON, "Dawn over the river Thames and Westminster in 1618, fog, timber houses, wherries on the water, the old Westminster Hall and Abbey towers, cold grey light", "Slow aerial glide over the misty river toward Westminster, boats moving, smoke from chimneys.", ""),
("D02", 3.28, "S", LON, "Sir Walter Raleigh, old with grey pointed beard, in black doublet and lace collar, standing calm on a wooden execution scaffold in Old Palace Yard Westminster, a hooded executioner with an axe beside him, crowd of Londoners in 1618 clothes and hats below, overcast morning", "Raleigh looks at the crowd with calm dignity and kneels slowly; the executioner lifts the axe high; the camera cuts away before any blow. Sound: murmuring crowd, a drum roll, wind. No music, no speech.", "R"),
("D03", 6.26, "K", LON, "An English galleon of 1617 with patched sails crossing a stormy Atlantic ocean, huge grey waves", "The galleon pitches through a big wave, spray over the bow, sails straining.", ""),
("D04", 8.02, "K", LON, "English soldiers in 1618 morion helmets burying a young man wrapped in a cloth by torchlight on the muddy bank of the Orinoco river, dense tropical jungle, night", "Soldiers lower the body into the grave, torches flicker, one removes his helmet in grief.", ""),
("D05", 9.56, "K", LON, "Sir Walter Raleigh kneeling before King James I on his throne in the dark wood-panelled Whitehall palace, 1616, courtiers in ruffs watching, candlelight", "Raleigh bows his head, the king leans forward coldly, candle flames flicker.", "R"),
("D06", 12.2, "S", NG, "A mythical city of gold with golden roofs and pyramids glowing in the middle of a misty Amazon jungle at sunrise, seen from a hill, dreamlike", "Slow push-in toward the glowing golden city as mist drifts and sun rays break through. Sound: jungle birds, distant wind, a soft shimmering tone. No music, no speech.", ""),
("D07", 14.4, "K", NG, "The same misty jungle hill at sunrise but with no city at all, only endless empty rainforest and fog", "Mist slowly swallows the treetops, the camera drifts forward over empty jungle.", ""),
("D08", 16.84, "K", MU, "Aerial view at dawn of the round emerald-green crater lake of Guatavita surrounded by green Andean hills and mist, Colombia", "Slow aerial descent toward the round lake, mist moving over the water.", ""),
("D09", 20.16, "K", NG, "Gold coins, a gold Muisca figurine and a rolled 16th century map spilling on a dark wooden table lit by a single candle", "Gold coins slowly roll and settle, candle flame flickers, very slow push-in.", ""),
("D10", 24.46, "S", MU, "The round crater lake of Guatavita from the rim at sunrise, dark still water, green Andean hills with native forest, low clouds, a small reed raft on the shore", "Slow drone move over the crater rim revealing the whole round lake under drifting clouds. Sound: cold wind, birds of the Andes, lapping water. No music, no speech.", ""),
("D11", 28.28, "K", NG, "A 16th century Spanish chronicler monk writing with a quill on a parchment manuscript by candlelight in a stone room", "The quill scratches across the page, candle flickers, slow push-in to the ink.", ""),
("D12", 30.56, "K", MU, "The Muisca cacique, with feathered gold diadem and gold nose ornament, standing inside a large round thatched ceremonial house, Muisca priests in white painted cotton mantles around him, smoke of burning resin", "Priests move around the cacique chanting silently, smoke curls upward, torchlight flickers.", "C"),
("D13", 32.7, "K", MU, "Close-up of hands of Muisca priests smearing sticky tree resin on the bare chest and shoulders of the cacique, torchlight", "Hands spread the glistening resin slowly over his skin.", "C"),
("D14", 34.12, "S", MU, "Muisca priests blowing fine gold dust through cane tubes onto the cacique's resin-covered body, his skin turning into shining gold, torchlight in the dark", "Clouds of glittering gold dust float and settle on his skin; he closes his eyes. Sound: soft blowing, crackling torches, low drums far away. No music, no speech.", "C"),
("D15", 35.76, "K", MU, "The gilded cacique stepping onto a large reed raft on the shore of Guatavita lake at dawn, four attendants with feather headdresses, braziers of burning incense on the raft, mist", "The cacique steps onto the raft, attendants push off, incense smoke drifts over the water.", "C"),
("D16", 37.6, "S", MU, "The gilded cacique standing on the reed raft in the center of the misty lake of Guatavita at sunrise throwing gold figurines and green emeralds into the dark water", "He raises his arms and throws the gold offerings into the lake, they splash and glitter; attendants bow. Sound: splashes, water, conch shell far away on the shore. No music, no speech.", "C"),
("D17", 41.38, "K", MU, "Underwater view of small gold Muisca figurines (tunjos) and emeralds slowly sinking into dark green lake water, light rays from above", "The gold figures sink slowly and fade into darkness.", ""),
("D18", 42.7, "K", MU, "A Muisca goldsmith pouring molten gold into a clay mould by firelight in a thatched hut, small gold tunjo figurines on a mat", "Molten gold glows as it is poured, sparks and heat shimmer.", ""),
("D19", 45.24, "K", MU, "Clay offering vessels full of gold tunjo figurines placed in a sacred rock cave, candles, reverent atmosphere", "Very slow push-in, candle flames flicker, gold glints.", ""),
("D20", 47.0, "K", NG, "Spanish conquistadors in quilted cotton armor and steel helmets sitting around a campfire at night listening to an indigenous guide who gestures while speaking, greedy eyes", "The guide gestures toward the mountains, the soldiers lean in, firelight flickers on their faces.", ""),
("D21", 50.38, "K", NG, "Close-up of a conquistador's rough hand drawing an arrow with charcoal on a crude parchment map toward mountains, campfire light", "The charcoal draws a long arrow across the map.", ""),
("D22", 51.98, "K", MU, "Cold rain falling on the dark surface of Guatavita lake, grey clouds, empty shore", "Raindrops ripple the lake surface, slow drift.", ""),
("D23", 53.18, "K", MU, "An abandoned overgrown ceremonial site on the shore of Guatavita lake, a rotting old reed raft half sunk among reeds, broken clay pots, mist", "Slow dolly past the rotting raft, reeds swaying in the wind.", ""),
("D24", 57.9, "K", CORTE, "Interior of a Renaissance Augsburg merchant bank counting house in 1528, piles of gold coins, balance scales, ledgers, German bankers in fur-trimmed robes and flat caps", "A banker stacks gold coins and writes in a ledger, coins clink, candlelight.", ""),
("D25", 60.58, "K", CORTE, "Emperor Charles V in 1528, aged 28, with Habsburg jaw and short beard, black clothes and the golden fleece collar, seated on a throne in a Spanish palace hall with tapestries", "The emperor turns his head slowly toward the camera, courtiers move behind.", ""),
("D26", 63.42, "K", CORTE, "German banker Bartholomew Welser in fur-trimmed robe presenting an open debt ledger to the young emperor Charles V in a palace hall, 1528", "The banker bows and opens the ledger, the emperor looks at the numbers.", ""),
("D27", 65.84, "K", CORTE, "Two German Welser bankers in fur robes reading a large parchment contract with red wax seals at a table in Augsburg, 1528", "They unroll the contract and look at each other with satisfaction.", ""),
("D28", 68.34, "K", CORTE, "Close-up of a hand pressing a royal seal into red wax on a parchment next to a hand-drawn 16th century map of the coast of Venezuela", "The seal presses into the hot wax and lifts, revealing the imperial eagle.", ""),
("D29", 71.26, "K", CORTE, "German landsknecht soldiers with halberds and slashed puffed clothes landing from rowing boats on the tropical beach of Coro, Venezuela in 1529, carracks anchored behind", "Soldiers wade ashore from the boats, flags in the wind, waves on the beach.", ""),
("D30", 74.96, "S", MU, "Golden sunset light reflecting on the still round lake of Guatavita, the water shining like liquid gold, silhouette of the crater hills", "Very slow push-in over the glowing golden water as the sun sinks and mist rises. Sound: evening wind, frogs, gentle water. No music, no speech.", ""),
("D31", 80.4, "K", NG, "Spanish expedition of 1536 leaving the Caribbean town of Santa Marta, hundreds of soldiers with pikes, horses and indigenous porters marching along the coast, small brigantines at sea", "The column marches out along the beach, flags flutter, horses snort.", ""),
("D32", 85.94, "S", NG, "Exhausted Spanish conquistadors in rusty helmets hacking through dense tropical jungle with swords, a feverish sweating man supported by two others, heavy humidity", "The men cut vines and push forward, the sick man stumbles. Sound: machete chops, insects, heavy breathing, jungle birds. No music, no speech.", ""),
("D33", 87.94, "K", NG, "A large caiman gliding in the muddy Magdalena river next to a small crowded brigantine with starving thin Spanish soldiers", "The caiman slides closer, soldiers pull back in fear.", ""),
("D34", 90.1, "S", NG, "Gonzalo Jiménez de Quesada leading a small ragged group of conquistadors and a few horses out of the forest onto the green high savanna of Bogotá, round thatched Muisca villages with smoke in the distance, cold mist", "The men stop and stare at the wide green savanna, Quesada steps forward. Sound: cold wind, horse snorts, distant birds. No music, no speech.", "Q"),
("D35", 93.4, "K", NG, "Spanish soldiers looting a Muisca temple, carrying gold breastplates and figurines out of a round thatched temple, smoke", "Soldiers run out carrying gold, one drops a figurine.", ""),
("D36", 95.02, "K", NG, "Gonzalo Jiménez de Quesada kneeling beside a pile of gold objects and bright green emeralds on a blanket, holding a large emerald up to the light", "He turns the emerald in the light, eyes narrowing, gold glinting.", "Q"),
("D37", 99.86, "K", NG, "Gonzalo Jiménez de Quesada standing alone at the edge of a misty empty lake at dawn, seen from behind", "He stares at the empty water, mist drifting, wind moves his sash.", "Q"),
("D38", 102.64, "K", NG, "A Spanish sentry on a hill of the Bogotá savanna pointing at a dust cloud of an approaching army on the horizon", "The sentry points and shouts silently, the dust cloud grows.", ""),
("D39", 104.88, "S", NG, "German conquistador Nicolás Federmann, blond with red beard, leading exhausted gaunt soldiers dressed in deer and jaguar skins down from the cold páramo with frailejón plants, 1539", "The ragged column descends slowly through the mist, men limping. Sound: wind of the páramo, footsteps on wet grass, coughing. No music, no speech.", ""),
("D40", 109.46, "K", NG, "Close-up of exhausted soldiers wrapped in animal skins, frostbitten faces, rusty helmets, cold páramo fog", "They shiver and trudge forward, breath visible in the cold air.", ""),
("D41", 113.42, "K", NG, "Sebastián de Belalcázar in full armor on horseback leading Spanish cavalry and a herd of pigs along an Andean mountain road from Quito, 1539", "The cavalry rides forward, pigs trot along, banners wave.", ""),
("D42", 117.36, "S", NG, "Three Spanish and German conquistador leaders facing each other in a tense standoff on the green savanna of Bogotá, their three separate armies behind them, 1539, overcast", "The three leaders step closer, hands on sword hilts, soldiers tense behind. Sound: wind, armor clinking, horses. No music, no speech.", "Q"),
("D43", 121.56, "K", MU, "An empty reed raft drifting alone on the misty lake, no one on it", "The empty raft drifts slowly in the fog.", ""),
("D44", 123.62, "K", NG, "The three conquistador leaders shaking hands reluctantly inside a tent, candle, suspicious looks", "They shake hands slowly, eyes full of distrust.", "Q"),
("D45", 126.1, "K", CORTE, "Spanish royal court of the Council of the Indies in Valladolid in the 1540s, lawyers in black gowns arguing with scrolls, judges behind a long table piled with documents", "Lawyers wave papers and argue, a judge taps the table, candlelight.", ""),
("D46", 129.9, "S", NG, "Swirling gold dust in the air over the jungle forming the shape of a golden city in the clouds, magical and dreamlike", "The gold dust swirls and slowly assembles into towers and roofs of a city. Sound: wind, soft shimmering. No music, no speech.", ""),
("D47", 133.18, "K", NG, "A Spanish expedition on a high ridge looking out over an endless green Amazon rainforest stretching to the horizon, mist in the valleys", "The camera rises behind the men revealing the endless jungle.", ""),
("D48", 137.42, "K", MU, "The gilded cacique on his raft in the mist, fading like a ghost", "The cacique slowly dissolves into the mist.", "C"),
("D49", 139.66, "S", NG, "A vast legendary city of gold hidden in the jungle, golden roofs, temples and walls, lakes, seen from above at golden hour", "Slow aerial flight toward the golden city, birds flying below. Sound: wind, distant jungle birds. No music, no speech.", ""),
("D50", 142.06, "K", NG, "Close view of golden roofs gleaming through jungle mist and giant trees", "Mist moves between the golden roofs, light glints.", ""),
("D51", 145.02, "K", NG, "A conquistador questioning an indigenous man in front of his village, the man points far away to the mountains", "The indigenous man raises his arm and points to the distance.", ""),
("D52", 148.54, "K", NG, "Extreme close-up of an indigenous man's hand pointing toward distant blue mountains", "Rack focus from the pointing finger to the far mountains.", ""),
("D53", 149.78, "K", NG, "Conquistadors marching away toward distant mountains while behind them an indigenous village with smoke from its huts stays in the opposite direction, the indigenous man watches them go", "The soldiers walk away into the distance, the indigenous man turns back to his village.", ""),
("D54", 153.9, "K", NG, "A dark thunderstorm gathering over the Amazon jungle, lightning", "Clouds churn, lightning flashes over the forest.", ""),
("D55", 156.24, "K", NG, "Starving gaunt conquistadors sitting around a small fire in the rain at night, a saddle and bridle beside them, no horses left", "They stare at the fire in silence, rain drips from their helmets.", ""),
("D56", 158.52, "S", NG, "Lope de Aguirre, wild-eyed gaunt Basque conquistador with grey beard in 1561, standing on a crude riverboat on the Amazon raising his sword and shouting in defiance, his men behind", "He raises the sword and shouts with fury, the boat drifts on the brown river. Sound: river, thunder, men shouting far away. No speech.", ""),
("D57", 161.84, "K", MU, "Hundreds of indigenous workers cutting a deep notch into the rim of the Guatavita crater in the 1580s under a Spanish overseer, water beginning to drain", "Workers dig with tools, water starts rushing out through the cut.", ""),
("D58", 164.92, "K", MU, "The gilded cacique standing on his raft in the middle of the misty lake of Guatavita at dawn, golden light, epic and mysterious", "Very slow push-in on the golden figure in the mist, water still.", "C"),
]


def imagen(desc, era):
    return (f"Upright vertical portrait photo. {desc}. Upright vertical portrait photo, camera level, "
            f"horizon horizontal. Photorealistic cinematic film still, {era}, deep green and warm gold palette, "
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
