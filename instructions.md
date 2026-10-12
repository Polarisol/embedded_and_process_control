# Instructions

## Test the site locally

1. Start a local web server from the project folder:

   ```bash
   cd ~/Work/ClaudeTest && python -m http.server 8000
   ```

2. Open <http://localhost:8000/> in your browser.

3. When you're done, stop the server with `Ctrl+C` in the terminal.

The site must be viewed through the server. Opening `index.html` directly (double-clicking it) won't work, because browsers block it from loading the content files.

## Test on your phone

You can open the site from a phone (or any other device) on the same Wi‑Fi network.

1. Start the server as above. `python -m http.server` already accepts connections from other devices.

2. Find your computer's local network address:

   ```bash
   ip -4 -br addr
   ```

   Look for the Wi‑Fi interface (e.g. `wlo1`) and an address like `192.168.1.176`.

3. Allow the phone through the firewall. Omarchy turns on the `ufw` firewall, which blocks all incoming connections by default. This opens port 8000 only to devices on your home network (adjust `192.168.1.0/24` if your address starts differently):

   ```bash
   sudo ufw allow from 192.168.1.0/24 to any port 8000 proto tcp
   ```

4. On the phone, open `http://<your-address>:8000`, e.g. <http://192.168.1.176:8000>.

5. When you're done testing, close the port again:

   ```bash
   sudo ufw delete allow from 192.168.1.0/24 to any port 8000 proto tcp
   ```

   To see the current firewall rules, run `sudo ufw status numbered`.

If the page still doesn't load, your router may be keeping Wi‑Fi devices from reaching each other. This is often called "client isolation" or "AP isolation", and guest networks commonly have it on. Turn it off in the router's settings, or connect the phone to the main (non-guest) network.
