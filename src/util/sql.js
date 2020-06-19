export const sql = {
    selectConfigValByKey(key) {
        return 'select value from config where key = ?'
    }

}