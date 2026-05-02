// worker.js
self.onmessage = function(e) {
    const { profiles, social } = e.data;
    const DB_NAME = "DrawariaLocalDB";

    const request = indexedDB.open(DB_NAME, 1);

    request.onsuccess = function(event) {
        const db = event.target.result;
        
        // Procesar perfiles en lotes (Chunks) de 10,000 para no saturar el disco
        const processStore = (data, storeName) => {
            return new Promise((resolve) => {
                const transaction = db.transaction(storeName, "readwrite");
                const store = transaction.objectStore(storeName);
                
                let i = 0;
                function insertNext() {
                    const chunk = data.slice(i, i + 10000);
                    chunk.forEach(item => store.put(item));
                    i += 10000;

                    if (i < data.length) {
                        self.postMessage({ status: `Guardando ${storeName}: ${Math.round((i/data.length)*100)}%` });
                        setTimeout(insertNext, 1); // Pausa mínima para dejar respirar al sistema
                    } else {
                        resolve();
                    }
                }
                insertNext();
            });
        };

        async function start() {
            await processStore(profiles, "profiles");
            await processStore(social, "social");
            self.postMessage({ status: "¡TERMINADO!", complete: true });
        }

        start();
    };
};