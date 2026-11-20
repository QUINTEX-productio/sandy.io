"""Optional micro:bit V2 MicroPython firmware for UART buttons/status.

micro:bit edge connector pin1 TX -> ESP32 assigned RX
micro:bit edge connector pin2 RX <- ESP32 assigned TX
micro:bit GND -> ESP32 GND; both sides use 3.3V logic.
No separate ESP32 power connection is needed if each board is powered by USB.
"""
from microbit import uart, button_a, button_b, display, Image, sleep, pin1, pin2

uart.init(baudrate=9600, tx=pin1, rx=pin2)
display.show(Image.HAPPY)
last_a = False
last_b = False
buffer = b""

while True:
    a = button_a.is_pressed()
    b = button_b.is_pressed()
    if a and not last_a:
        uart.write('{"device":"microbit","event":"button_a","value":1}\n')
    if b and not last_b:
        uart.write('{"device":"microbit","event":"button_b","value":1}\n')
    last_a, last_b = a, b
    chunk = uart.read()
    if chunk:
        buffer += chunk
        if len(buffer) > 255:
            buffer = b""
        if b"\n" in buffer:
            line, buffer = buffer.rsplit(b"\n", 1)
            # Lightweight status feedback (no JSON parser dependency on micro:bit).
            if b'SITTING_BAD' in line:
                display.show(Image.NO)
            elif b'SITTING_GOOD' in line:
                display.show(Image.YES)
            else:
                display.show(Image.ASLEEP)
    sleep(50)
