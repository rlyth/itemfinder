document.getElementById('findItem').addEventListener('click', function(event) {
	// Reset style elements
	document.getElementById('report').style.visibility = "hidden";
	document.getElementById('error').style.display = "none";
	document.getElementById('chars').textContent = "";
	
	var req = new XMLHttpRequest();
	
	var key = document.getElementById('api_key').value;
	
	req.open("GET", "https://api.guildwars2.com/v2/tokeninfo?access_token=" + key, true);
	
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			var response = JSON.parse(req.responseText);
	
			// If the key doesn't have enough permissions
			if(response.permissions.indexOf("characters") == -1
				|| response.permissions.indexOf("inventories") == -1) {
					// Display error message on page
				document.getElementById('error').textContent = "Key is missing required permissions";
				document.getElementById('error').style.display = "block";
			}
			
			else {
				// Request account name
				getAccountName(key);
				
				// Continue main path to get the item id
				getItemId(key);
			}
		}
		// Log error message on failed call
		else {
			// Display error message on page
			document.getElementById('error').textContent = "Not a valid key";
			document.getElementById('error').style.display = "block";
			
			console.log("Error: " + response.statusText);
		}
	});

	req.send(null);
	event.preventDefault();
});


function getAccountName(key) {
	var req = new XMLHttpRequest();
	
	req.open("GET", "https://api.guildwars2.com/v2/account?access_token=" + key, true);
	
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			var response = JSON.parse(req.responseText);

			// Update account_name span with the key's account name
			document.getElementById('account_name').textContent = response.name;
			
		}
		// Log error message on failed call
		else {
			console.log("Error: " + response.statusText);
		}
	});

	req.send(null);
	event.preventDefault();
}


function getItemId(key) {
	var req = new XMLHttpRequest();
	
	var lostItem = document.getElementById('item_name').value;
	
	// If no item was specified
	if(lostItem === "") {
		// Display error message and return
		document.getElementById('error').textContent = "Please enter an item to search for";
		document.getElementById('error').style.display = "block";
		
		return;
	}
	
	req.open("GET", "https://www.gw2spidy.com/api/v0.9/json/item-search/" + lostItem, true);
	
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			var response = JSON.parse(req.responseText);
			
			// If the search returned results
			if(response.total > 0) {
				// Search all results for an exact match
				for (var i = 0; i < response.count; i++) {
					if(response.results[i].name == lostItem) {
						document.getElementById('item').textContent = response.results[i].name;
						
						// Exact match found, continue main path to get character information
						searchCharForItem(key, response.results[i].data_id);
					
						return;
					}
				}
			}
			
			// No search results returned
			if(response.total == 0) {
				// Display error message and stop
				document.getElementById('error').textContent = "Cannot find item " + lostItem;
				document.getElementById('error').style.display = "block";
			}
			
			// Search results returned but no exact match, display suggested searches in error div
			else {
				document.getElementById('error').textContent = "Cannot find exact match. Try one of these instead:";
				
				var itemList = document.createElement("div");
				document.getElementById('error').appendChild(itemList);
				
				// Display the item names of the first 25 search results
				var i = 0;
				while(i < response.count && i < 25) {					
					itemList.innerHTML += "<br />" + response.results[i].name;
					
					i++;
				}
				document.getElementById('error').style.display = "block";
			}
		}
		// Log error message on failed call
		else {
			console.log("Error: " + response.statusText);
		}
	});

	req.send(null);
	event.preventDefault();
};


function searchCharForItem(key, itemID) {
	var req = new XMLHttpRequest();
	
	req.open("GET", "https://api.guildwars2.com/v2/characters?page=0&access_token=" + key, true);
	
	req.addEventListener('load', function() {
		if(req.status >= 200 && req.status < 400) {
			var response = JSON.parse(req.responseText);
			
			var charList = [];
			var charsHasItem = [];
			
			// For all characters in the account
			for(var i = 0; i < response.length; i++) {
				// For all of the character's inventory bags
				for(var j = 0; j < response[i].bags.length; j++) {
					// If a bag exists in this slot
					if(response[i].bags[j] != null) {
						// For all the items in the bag
						for (var k = 0; k < response[i].bags[j].inventory.length; k++) {
							// If there is an item in this inventory slot
							if(response[i].bags[j].inventory[k] != null) {
								// If the item id in this slot matches the id we are searching for
								// and the character has not already been added to the array
								if(response[i].bags[j].inventory[k].id == itemID
									&& charList.indexOf(response[i].name) == -1) {
									// Prevent duplicate entries
									charList.push(response[i].name);
										
									// Populate an object with this charcter's info
									var thisChar = {name:"", level:"", race:"", prof:""};
									thisChar.name = response[i].name;
									thisChar.level = response[i].level;
									thisChar.race = response[i].race;
									thisChar.prof = response[i].profession;
									
									// Add the character to the array
									charsHasItem.push(thisChar);
								}
							}
						}
					}
				}
			}
			
			// Add all the characters that have the lost item to the chars div
			for(var i = 0; i < charsHasItem.length; i++) {
				var newChar = document.createElement("p");
				newChar.innerHTML = "<strong>" + charsHasItem[i].name + "</strong><br>";
				newChar.innerHTML += "Lv " + charsHasItem[i].level + " " + charsHasItem[i].race;
				newChar.innerHTML += " " + charsHasItem[i].prof;
				document.getElementById('chars').appendChild(newChar);
			}
			
			// Item not found in any character's inventory
			if(charsHasItem.length == 0) {
				document.getElementById('chars').textContent = "None :(";
			}
			
			document.getElementById('report').style.visibility = "visible";
			
		}
		// Log error message on failed call
		else {
			console.log("Error: " + response.statusText);
		}
	});

	req.send(null);
	event.preventDefault();
}