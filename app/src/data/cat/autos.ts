// Coches y motos que se venden en México. Precios de referencia en MXN (desde, aprox. 2026); el usuario los puede cambiar.
// Formato: "#tipo Etiqueta", "@Marca", "Modelo|precio|foto|id"
export default `
#autos Autos
@Nissan
March|299900
Versa|374900|versa.webp|versa
V-Drive|289900
Sentra|469900
Kicks|562900|kicks.webp|kicks
X-Trail|649900
NP300 Frontier|459900
Frontier Pro-4X|789900
Pathfinder|1029900
@Chevrolet
Aveo|289900
Onix|319900
Groove|319900
Tracker|419900
Captiva|489900
Equinox|629900
Blazer EV|1099900
S10 Max|489900
Silverado|899900
Tahoe|1599900
@Volkswagen
Virtus|379900
Jetta|438070|vw-jetta.webp|vw-jetta
Jetta GLI|629900
Golf GTI|739900|vw-gti.webp|vw-gti
Nivus|409900
T-Cross|429900
Taos|529900
Tiguan|659900
Teramont|929900
Saveiro|329900
Amarok|899900
@Toyota
Raize|359900
Yaris Sedán|359900
Corolla|449900|corolla.webp|corolla
Corolla Cross|529900
Prius|599900
RAV4|629900|rav4.webp|rav4
Camry|649900
Hilux|489900
Tacoma|899900
Sienna|1099900
GR86|849900
GR Supra|1399900
@Kia
K3 Sedán|359900
K4 Sedán|398900|kia-k4.webp|kia-k4
K4 Hatchback|528900|kia-k4-hb.webp|kia-k4-hb
K4 Hatchback GT-Line|576900|kia-k4-hb.webp
Sonet|389900
Seltos|469900
Sportage|599900
Sorento|849900
Carnival|999900
EV6|1149900
@Mazda
Mazda 2 Sedán|339900
Mazda 3 Sedán|403900
Mazda 3 Hatchback|469900|mazda3-hb.webp|mazda3-hb
CX-30|509900|mazda-cx30.webp|mazda-cx30
CX-5|579900
CX-50|699900
CX-90|1049900
MX-5 Miata|599900|mazda-mx5.webp|mazda-mx5
@Hyundai
Grand i10|289900
HB20|309900
Creta|429900
Elantra|459900
Tucson|599900|tucson.webp|tucson
Santa Fe|899900
Ioniq 5|1099900
@Honda
City|389900
BR-V|459900
HR-V|509900
Civic|549900|civic.webp|civic
CR-V|649900|crv.webp|crv
Accord|729900
Pilot|1049900
Civic Type R|1099900
@Ford
Territory|529900
Escape|599900
Bronco Sport|679900
Maverick|629900
Ranger|699900
Mustang|899900|mustang.webp|mustang
Mustang Mach-E|1049900
Explorer|1099900
Bronco|999900
Lobo|1199900
@MG
MG3|279900
MG5|299900
ZS|349900
MG4 eléctrico|579900
HS|449900
GT|399900
@Chirey
Tiggo 2 Pro|299900
Tiggo 4|379900
Tiggo 7|459900
Tiggo 8|559900
Arrizo 8|449900
@BYD
Dolphin Mini|358800
Dolphin|459800|byd-dolphin.webp|byd-dolphin
Yuan Pro|509800
Seal|819800
Song Plus|659800
Shark|899800
King|429800
Han|1049800
@Jeep
Renegade|489900
Compass|599900
Commander|749900
Wrangler|1049900|wrangler.webp|wrangler
Gladiator|1099900
Grand Cherokee|1249900
@Renault
Kwid|269900
Kardian|359900
Duster|419900
Oroch|459900
Koleos|729900
@Suzuki
Swift|299900
Dzire|289900
Ignis|299900
Ertiga|369900
Vitara|429900
Jimny|479900
@Mitsubishi
Mirage|299900
Xpander|429900
Outlander|659900
L200|569900
@Peugeot
208|369900
2008|459900
3008|699900
Landtrek|559900
@GWM
Haval Jolion|429900
Haval H6|599900
Ora 03|599900
Tank 300|999900
@JAC
Sei2|299900
Sei4 Pro|389900
E10X|339900
Frison T8|549900
@Tesla
Model 3|899900|tesla-m3.webp|tesla-m3
Model Y|949900
Model S|1999900
@Fiat
Mobi|259900
Pulse|369900
Fastback|429900
500e|649900
@Dodge y RAM
Attitude|289900
RAM 700|349900
Durango|1099900
RAM 1500|999900
RAM TRX|2199900
@Subaru
Impreza|519900
Crosstrek|579900
Forester|659900
WRX|889900
@Mini
Cooper|649900
Countryman|829900
@Cupra
Formentor|699900
León|619900
Born|849900
@BMW
Serie 2 Gran Coupé|829900
Serie 3|949900|bmw-serie3.webp|bmw-serie3
X1|899900
X3|1199900
X5|1749900
M2|1799900
M3 Competition|2399900
@Mercedes-Benz
Clase A|749900
CLA|899900
GLA|949900
Clase C|1099900
GLC|1299900
G 63 AMG|5299900
@Audi
A3|719900
Q3|849900
A4|949900
Q5|1149900
RS 3|1599900
@Volvo
EX30|849900
XC40|949900
XC60|1199900
XC90|1699900
@Porsche
Macan|1699900
Cayenne|2399900
911 Carrera|3399900
Taycan|2499900
@Lujo y sueños
Ferrari Roma|5900000
Lamborghini Urus|6500000
Mercedes-AMG GT|3500000
Range Rover Sport|3200000
Land Rover Defender|2200000
#motos Motos
@Italika
FT150|25999
DM200|36999
WS175|33999
Vort-X 300|79999
250Z|47999
@Honda
Navi 110|29990
Dio 110|33990
CB190R|57990
XR150L|52990
CBR500R|169990
CB650R|229990
Africa Twin|399990
@Yamaha
FZ 2.0|44990
NMAX 155|76990
XTZ 250|99990
MT-03|129990
R3|134990
MT-07|219990|mt07.webp|mt07
R7|249990
MT-09|299990
YZF-R1|579990
@Suzuki
Gixxer 150|47990
V-Strom 250|109990
GSX-8S|229990
Hayabusa|459990
@Kawasaki
Ninja 400|139900|ninja400.webp|ninja400
Z650|179900
Versys 650|219900
Z900|269900
Ninja ZX-6R|309900
@KTM
200 Duke|69900
390 Duke|129900
RC 390|139900
390 Adventure|159900
890 Duke R|299900
@BMW Motorrad
G 310 R|129900
F 900 R|299900
R 1300 GS|549900
S 1000 RR|649900
@Harley-Davidson
Nightster|339900
Sportster S|399900
Fat Boy|569900
Street Glide|729900
Pan America|499900
@Ducati
Scrambler Icon|249900|ducati-scrambler.webp|ducati-scrambler
Monster|349900
Panigale V2|499900
Multistrada V4|699900
@Royal Enfield
Hunter 350|74900
Classic 350|84900|re-classic.webp|re-classic
Meteor 350|89900
Himalayan 450|129900
Interceptor 650|129900
@Vento
Tornado 250|42990
Nitrox 250|46990
Cyclone 300|59990
@Vespa
Primavera 150|109900|vespa.webp|vespa
GTS 300|169900
@Triumph
Trident 660|219900
Street Triple RS|309900
Bonneville T120|339900
@Bajaj y TVS
Pulsar NS200|55990
Dominar 400|89990
TVS Apache RTR 200|49990
#autos Autos
@Omoda y Jaecoo
Omoda C5|399900
Omoda O5 GT|449900
Jaecoo 7|549900
@Geely
Coolray|379900
Starray|529900
@GAC
GS3 Emzoom|429900
Emkoo|549900
@Changan
CS35 Plus|349900
Alsvin|299900
@Jetour
Dashing|499900
@Acura
Integra|729900
RDX|1049900
@Lexus
UX|899900
NX|1149900
RX|1499900
@Cadillac y Lincoln
Cadillac Escalade|2999900
Cadillac Lyriq|1599900
Lincoln Nautilus|1399900
@Land Rover
Range Rover Evoque|1199900
@Alfa Romeo
Tonale|899900
Giulia Quadrifoglio|2099900
@Volkswagen
Crafter|899900
Transporter|899900
#motos Motos
@Italika
DT150|32999
@Honda
XR190L|59990
Rebel 500|159990
CB500X|179990
@Yamaha
YZF-R15|74990
Ténéré 700|279990
@Suzuki
DR650|169990
@Kawasaki
Vulcan S|179900
@KTM
1390 Super Duke R|459900
@BMW Motorrad
R 18|599900
@Ducati
Diavel V4|599900
@Triumph
Speed 400|99900
@Eléctricas
Super Soco TC Max|49999
#bicis Bicis y scooters
@Bicicletas
Trek Marlin 5|14999
Specialized Allez|28999
Giant Talon|17999
Cannondale eléctrica|45999
Bici urbana fija|7999
@Scooters
Xiaomi Electric Scooter 4 Pro|13999
Segway Ninebot Max G2|15999
`
