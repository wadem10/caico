document.getElementById("recommendButton").addEventListener("click", async () => {
    const songList = document.getElementById("songList");
    songList.innerHTML = ""; // Clear previous list

    try {
        // Fetch data from the serverless function with query parameters
        const url = "https://c2pqgy593c.execute-api.us-east-2.amazonaws.com/Prod/caico-resource?sheetId=1yMiVxDV4uTuCNKnWTUw3b2qqaWF2aiUgJB4HBgdjAKM&range=Sheet1!A1:B10";
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Directly use the musicRecommendations array
        const recommendedSongs = data.musicRecommendations;
        if (!recommendedSongs || recommendedSongs.length === 0) {
            songList.innerHTML = "<li>No recommendations available.</li>";
            return;
        }

        recommendedSongs.forEach((recommendation) => {
            const listItem = document.createElement("li");
            listItem.textContent = `${recommendation.song} - ${recommendation.artist}`;
            songList.appendChild(listItem);
        });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        songList.innerHTML = `<li>Error fetching recommendations: ${error.message}</li>`;
    }
});
