EESchema Schematic File Version 2
LIBS:power
LIBS:device
LIBS:transistors
LIBS:conn
LIBS:linear
LIBS:regul
LIBS:74xx
LIBS:cmos4000
LIBS:adc-dac
LIBS:memory
LIBS:xilinx
LIBS:microcontrollers
LIBS:dsp
LIBS:microchip
LIBS:analog_switches
LIBS:motorola
LIBS:texas
LIBS:intel
LIBS:audio
LIBS:interface
LIBS:digital-audio
LIBS:philips
LIBS:display
LIBS:cypress
LIBS:siliconi
LIBS:opto
LIBS:atmel
LIBS:contrib
LIBS:valves
LIBS:relay_ftr_h2
LIBS:radio interface roip-cache
EELAYER 25 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title ""
Date ""
Rev ""
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L OPTO-TRANSISTOR-4 U1
U 1 1 5726253F
P 1750 1600
F 0 "U1" H 1550 1800 50  0000 L CNN
F 1 "4N25" H 1550 1400 50  0000 L CNN
F 2 "" H 1550 1400 50  0000 L CIN
F 3 "" H 1750 1600 50  0000 L CNN
	1    1750 1600
	1    0    0    1   
$EndComp
Text Notes 900  850  0    60   ~ 0
A\nmind. +10V\nbei Träger
$Comp
L R R1
U 1 1 57262A60
P 1150 1700
F 0 "R1" V 1230 1700 50  0000 C CNN
F 1 "1.25k" V 1150 1700 50  0000 C CNN
F 2 "" V 1080 1700 50  0000 C CNN
F 3 "" H 1150 1700 50  0000 C CNN
	1    1150 1700
	0    1    1    0   
$EndComp
Text Notes 2600 850  0    60   ~ 0
B\nmind. +10V\ndauerhaft
Text Notes 3700 850  0    60   ~ 0
C\nSendertastung durch Anlage\nvon +10V von B
Text Notes 6000 850  0    60   ~ 0
D\nHörerausgang\nNF (Masse)
Text Notes 6750 850  0    60   ~ 0
E\nHörerausgang\nNF (heiß)
Text Notes 7550 850  0    60   ~ 0
F\nNF Mikrofoneingang (mit H)\n4 mV an 200 Ohm
Text Notes 8950 850  0    60   ~ 0
H\nNF Mikrofoneingang (mit F)\n4 mV an 200 Ohm
Text Notes 10500 750  0    60   ~ 0
J\nMasse
$Comp
L TRANSFO-AUDIO T1
U 1 1 57263296
P 7250 2150
F 0 "T1" H 7250 2610 50  0000 C CNN
F 1 "NFU 1:1" H 7260 2520 50  0000 C CNN
F 2 "" H 7250 2150 50  0000 C CNN
F 3 "" H 7250 2150 50  0000 C CNN
	1    7250 2150
	1    0    0    -1  
$EndComp
$Comp
L TRANSFO-AUDIO T2
U 1 1 57263303
P 9450 2150
F 0 "T2" H 9450 2610 50  0000 C CNN
F 1 "NFU 1:1" H 9460 2520 50  0000 C CNN
F 2 "" H 9450 2150 50  0000 C CNN
F 3 "" H 9450 2150 50  0000 C CNN
	1    9450 2150
	1    0    0    -1  
$EndComp
Text Notes 9750 3400 0    60   ~ 0
Heiß   Masse\nSoundkarte\nAusgang
Text Notes 7550 3400 0    60   ~ 0
Heiß   Masse\nSoundkarte\nEingang
$Comp
L R R2
U 1 1 5726A691
P 2500 2050
F 0 "R2" V 2580 2050 50  0000 C CNN
F 1 "10k" V 2500 2050 50  0000 C CNN
F 2 "" V 2430 2050 50  0000 C CNN
F 3 "" H 2500 2050 50  0000 C CNN
	1    2500 2050
	0    -1   -1   0   
$EndComp
$Comp
L R R4
U 1 1 5726A718
P 2900 2650
F 0 "R4" V 2980 2650 50  0000 C CNN
F 1 "4.7k" V 2900 2650 50  0000 C CNN
F 2 "" V 2830 2650 50  0000 C CNN
F 3 "" H 2900 2650 50  0000 C CNN
	1    2900 2650
	1    0    0    -1  
$EndComp
Text Notes 900  3150 0    60   ~ 0
GPIO +3,3V
Text Notes 1550 3250 0    60   ~ 0
GPIO IN\n+3,3V
Text Notes 2200 3150 0    60   ~ 0
GPIO GND
$Comp
L Q_NPN_BCE Q1
U 1 1 5726BA5F
P 3250 2400
F 0 "Q1" H 3550 2450 50  0000 R CNN
F 1 "BC547B" H 3850 2350 50  0000 R CNN
F 2 "" H 3450 2500 50  0000 C CNN
F 3 "" H 3250 2400 50  0000 C CNN
	1    3250 2400
	1    0    0    -1  
$EndComp
Text Notes 4200 3150 0    60   ~ 0
GPIO +5V
Text Notes 2950 3250 0    60   ~ 0
GPIO OUT\n+3,3V
$Comp
L R R3
U 1 1 5728AA50
P 2900 2150
F 0 "R3" V 2980 2150 50  0000 C CNN
F 1 "4.7k" V 2900 2150 50  0000 C CNN
F 2 "" V 2830 2150 50  0000 C CNN
F 3 "" H 2900 2150 50  0000 C CNN
	1    2900 2150
	1    0    0    -1  
$EndComp
$Comp
L RELAY_FTR_H2 K1
U 1 1 5728B046
P 3100 1450
F 0 "K1" H 3050 1750 70  0000 C CNN
F 1 "HF49FD" H 3130 1150 70  0000 C CNN
F 2 "" H 3100 1450 60  0000 C CNN
F 3 "" H 3100 1450 60  0000 C CNN
	1    3100 1450
	-1   0    0    -1  
$EndComp
$Comp
L D D1
U 1 1 5728B255
P 3850 1650
F 0 "D1" H 3850 1750 50  0000 C CNN
F 1 "1N 4148" H 3850 1550 50  0000 C CNN
F 2 "" H 3850 1650 50  0000 C CNN
F 3 "" H 3850 1650 50  0000 C CNN
	1    3850 1650
	0    -1   1    0   
$EndComp
Wire Wire Line
	1300 1700 1450 1700
Wire Wire Line
	850  1700 1000 1700
Wire Wire Line
	850  650  850  1700
Wire Wire Line
	10450 950  10450 650 
Wire Wire Line
	1400 1500 1450 1500
Wire Wire Line
	1400 950  1400 1500
Wire Wire Line
	8900 650  8900 1950
Wire Wire Line
	8900 1950 9050 1950
Wire Wire Line
	7500 650  7500 1150
Wire Wire Line
	7500 1150 8800 1150
Wire Wire Line
	8800 1150 8800 2350
Wire Wire Line
	8800 2350 9050 2350
Wire Wire Line
	6700 650  6700 1950
Wire Wire Line
	6700 1950 6850 1950
Wire Wire Line
	5950 650  5950 1150
Wire Wire Line
	5950 1150 6600 1150
Wire Wire Line
	6600 1150 6600 2350
Wire Wire Line
	6600 2350 6850 2350
Wire Wire Line
	7650 2350 7700 2350
Wire Wire Line
	7700 2350 7700 3100
Wire Wire Line
	9850 2350 9900 2350
Wire Wire Line
	9900 2350 9900 3100
Wire Wire Line
	7650 1950 7950 1950
Wire Wire Line
	7950 1950 7950 3100
Wire Wire Line
	9850 1950 10150 1950
Wire Wire Line
	10150 1950 10150 3100
Wire Wire Line
	2050 1700 2150 1700
Wire Wire Line
	2150 1700 2150 2150
Wire Wire Line
	2050 1500 2300 1500
Wire Wire Line
	2300 1500 2300 2250
Wire Wire Line
	2300 2050 2350 2050
Wire Wire Line
	2150 2150 850  2150
Wire Wire Line
	2300 2250 1500 2250
Connection ~ 2300 2050
Wire Wire Line
	2650 2050 2750 2050
Wire Wire Line
	850  2150 850  3150
Wire Wire Line
	1500 2250 1500 3150
Wire Wire Line
	2750 1900 2750 2350
Wire Wire Line
	2750 2350 2150 2350
Wire Wire Line
	2150 2350 2150 3150
Wire Wire Line
	3350 2600 3350 2900
Wire Wire Line
	2900 2300 2900 2500
Wire Wire Line
	2900 2400 3050 2400
Wire Wire Line
	4150 1400 4150 3150
Wire Wire Line
	2900 2800 2900 3150
Connection ~ 2900 2400
Wire Wire Line
	2900 2000 2900 1900
Connection ~ 2750 2050
Wire Wire Line
	2900 1900 2750 1900
Wire Wire Line
	2550 650  2550 1400
Wire Wire Line
	3350 2900 2150 2900
Connection ~ 2150 2900
Wire Wire Line
	3500 1300 3650 1300
Wire Wire Line
	3650 1300 3650 650 
Wire Wire Line
	2550 1400 2700 1400
Wire Wire Line
	3600 1400 4150 1400
Wire Wire Line
	3850 1400 3850 1500
Wire Wire Line
	3500 1500 3600 1500
Wire Wire Line
	3600 1500 3600 1400
Connection ~ 3850 1400
Wire Wire Line
	3500 1600 3600 1600
Wire Wire Line
	3600 1600 3600 1850
Wire Wire Line
	3600 1850 3850 1850
Wire Wire Line
	3850 1800 3850 2000
Wire Wire Line
	3350 2200 3350 2000
Connection ~ 3850 1850
Wire Wire Line
	3350 2000 3850 2000
Wire Wire Line
	1400 950  10450 950 
$EndSCHEMATC
